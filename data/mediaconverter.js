const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { spawn } = require('child_process');

class AudioConverter {
    constructor() {
        this.tempDir = path.join(__dirname, '../temp');
        this.ensureTempDir();
    }

    ensureTempDir() {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    async cleanFile(file) {
        try {
            if (file && fs.existsSync(file)) {
                await fs.promises.unlink(file);
            }
        } catch {}
    }

    filename(ext) {
        return `${Date.now()}-${crypto.randomBytes(5).toString('hex')}.${ext}`;
    }

    convert(buffer, args, ext, outExt) {
        const inputPath = path.join(this.tempDir, this.filename(ext));
        const outputPath = path.join(this.tempDir, this.filename(outExt));

        return new Promise(async (resolve, reject) => {
            let killed = false;

            try {
                await fs.promises.writeFile(inputPath, buffer);

                const ffmpeg = spawn(ffmpegPath, [
                    '-y',
                    '-loglevel', 'error',
                    '-i', inputPath,
                    ...args,
                    outputPath
                ]);

                const timer = setTimeout(() => {
                    killed = true;
                    ffmpeg.kill('SIGKILL');
                }, 30_000);

                let stderr = '';
                ffmpeg.stderr.on('data', d => stderr += d.toString());

                ffmpeg.on('close', async code => {
                    clearTimeout(timer);
                    await this.cleanFile(inputPath);

                    if (killed || code !== 0) {
                        await this.cleanFile(outputPath);
                        return reject(new Error('Audio conversion failed'));
                    }

                    try {
                        const data = await fs.promises.readFile(outputPath);
                        await this.cleanFile(outputPath);
                        resolve(data);
                    } catch (e) {
                        await this.cleanFile(outputPath);
                        reject(e);
                    }
                });

                ffmpeg.on('error', async err => {
                    clearTimeout(timer);
                    await this.cleanFile(inputPath);
                    await this.cleanFile(outputPath);
                    reject(err);
                });

            } catch (err) {
                await this.cleanFile(inputPath);
                await this.cleanFile(outputPath);
                reject(err);
            }
        });
    }

    // 🎵 Normal WhatsApp audio
    toAudio(buffer, ext) {
        return this.convert(buffer, [
            '-vn',
            '-map_metadata', '-1',
            '-ac', '2',
            '-ar', '44100',
            '-b:a', '128k',
            '-codec:a', 'libmp3lame'
        ], ext, 'mp3');
    }

    // 🎤 Voice note (PTT)
    toPTT(buffer, ext) {
        return this.convert(buffer, [
            '-vn',
            '-map_metadata', '-1',
            '-ac', '1',
            '-ar', '48000',
            '-b:a', '128k',
            '-codec:a', 'libopus',
            '-application', 'voip'
        ], ext, 'opus');
    }
}

module.exports = new AudioConverter();
