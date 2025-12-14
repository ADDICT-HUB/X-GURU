const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { spawn } = require('child_process');

class AudioConverter {
    constructor() {
        this.tempDir = path.join(__dirname, '../temp');
        this.logFile = path.join(__dirname, '../logs/converter.log');
        this.queue = Promise.resolve();
        this.ensureDirs();
    }

    ensureDirs() {
        for (const dir of [this.tempDir, path.dirname(this.logFile)]) {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        }
    }

    logError(err) {
        const time = new Date().toISOString();
        fs.appendFile(this.logFile, `[${time}] ${err.stack || err}\n`, () => {});
    }

    async safeUnlink(file) {
        try {
            if (file && fs.existsSync(file)) await fs.promises.unlink(file);
        } catch (e) {
            this.logError(e);
        }
    }

    name(ext) {
        return `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    }

    enqueue(task) {
        this.queue = this.queue.then(task).catch(() => {});
        return this.queue;
    }

    getDuration(file) {
        return new Promise(resolve => {
            const p = spawn(ffmpegPath, ['-i', file]);
            let out = '';
            p.stderr.on('data', d => out += d.toString());
            p.on('close', () => {
                const m = out.match(/Duration:\s(\d+):(\d+):(\d+)/);
                if (!m) return resolve(0);
                resolve(+m[1] * 3600 + +m[2] * 60 + +m[3]);
            });
        });
    }

    detectType(ext) {
        return ['mp4','mkv','avi','mov','webm'].includes(ext) ? 'video' : 'audio';
    }

    convert(buffer, args, inExt, outExt, limit = 300) {
        return this.enqueue(() => new Promise(async (resolve, reject) => {
            const input = path.join(this.tempDir, this.name(inExt));
            const output = path.join(this.tempDir, this.name(outExt));
            let killed = false;

            try {
                await fs.promises.writeFile(input, buffer);
                if (await this.getDuration(input) > limit) {
                    await this.safeUnlink(input);
                    return reject(new Error('Media too long'));
                }

                const ffmpeg = spawn(ffmpegPath, [
                    '-y',
                    '-loglevel', 'error',
                    '-i', input,
                    ...args,
                    output
                ]);

                const timer = setTimeout(() => {
                    killed = true;
                    ffmpeg.kill('SIGKILL');
                }, 60_000);

                ffmpeg.on('close', async code => {
                    clearTimeout(timer);
                    await this.safeUnlink(input);

                    if (killed || code !== 0) {
                        await this.safeUnlink(output);
                        return reject(new Error('Conversion failed'));
                    }

                    const data = await fs.promises.readFile(output);
                    await this.safeUnlink(output);
                    resolve(data);
                });

                ffmpeg.on('error', async e => {
                    clearTimeout(timer);
                    this.logError(e);
                    await this.safeUnlink(input);
                    await this.safeUnlink(output);
                    reject(e);
                });

            } catch (e) {
                this.logError(e);
                await this.safeUnlink(input);
                await this.safeUnlink(output);
                reject(e);
            }
        }));
    }

    toAudio(buffer, ext) {
        return this.convert(buffer, [
            '-vn',
            '-af', 'loudnorm',
            '-ac', '2',
            '-ar', '44100',
            '-b:a', '192k',
            '-codec:a', 'libmp3lame'
        ], ext, 'mp3');
    }

    toPTT(buffer, ext) {
        return this.convert(buffer, [
            '-vn',
            '-af', 'loudnorm',
            '-ac', '1',
            '-ar', '48000',
            '-b:a', '128k',
            '-codec:a', 'libopus',
            '-application', 'voip'
        ], ext, 'opus', 120);
    }

    async toWhatsAppAudio(buffer, ext) {
        try {
            return await this.toAudio(buffer, ext);
        } catch (e) {
            this.logError(e);
            return this.toPTT(buffer, ext);
        }
    }
}

module.exports = new AudioConverter();
