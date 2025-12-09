const { delay } = require("@whiskeysockets/baileys");
const { malvin } = require("../malvin");

const activeGames = new Map(); // To keep track of running games per chat

// ======= Squid Game =======
malvin({
  pattern: "squidgame",
  desc: "_Launch Squid Game in group, admins only_",
  category: "fun",
  filename: __filename,
}, async (malvin, mek, m, { isAdmin, isOwner, participants, reply }) => {
  try {
    if (!m.isGroup) return reply("❌ This command can only be used in groups.");
    if (!isAdmin && !isOwner) return reply("❌ Only admins can start the game.");
    if (activeGames.has(m.chat)) return reply("⚠️ A game is already running here!");

    // Filter only non-admin players
    let players = participants.filter(p => !p.admin);
    if (players.length < 5) return reply("⚠️ At least 5 non-admin members needed to play.");

    activeGames.set(m.chat, "squidgame");

    const gameCreator = "@" + m.sender.split("@")[0];
    let playersMentions = players.map(p => "@" + p.id.split("@")[0]).join("\n");

    await malvin.sendMessage(m.chat, {
      text: `🔴 *Squid Game: Red Light, 🟢 Green Light*\n\n🎭 *Front Man*: ${gameCreator}\n\nPlayers:\n${playersMentions}\n\nGame starting in 20 seconds...`,
      mentions: players.map(p => p.id)
    });

    await delay(20000);

    let remainingPlayers = [...players];

    // Helper to wait for player messages during time window
    const waitForMessages = async (timeMs) => {
      return new Promise(resolve => {
        let spoken = new Set();

        const onMessage = (msg) => {
          if (msg.messages[0].key.remoteJid === m.chat) {
            let sender = msg.messages[0].key.participant || msg.messages[0].key.remoteJid;
            if (remainingPlayers.find(p => p.id === sender)) spoken.add(sender);
          }
        };

        malvin.ev.on("messages.upsert", onMessage);

        setTimeout(() => {
          malvin.ev.off("messages.upsert", onMessage);
          resolve(spoken);
        }, timeMs);
      });
    };

    while (remainingPlayers.length > 1) {
      let isGreenLight = Math.random() > 0.5;
      await malvin.sendMessage(m.chat, { text: `🔔 ${isGreenLight ? "🟢 Green Light! Talk now!" : "🔴 Red Light! Stay silent!"}` });

      let spokenPlayers = await waitForMessages(7000);

      let eliminated = [];
      if (isGreenLight) {
        // Players who did NOT speak eliminated
        eliminated = remainingPlayers.filter(p => !spokenPlayers.has(p.id));
      } else {
        // Players who spoke eliminated
        eliminated = remainingPlayers.filter(p => spokenPlayers.has(p.id));
      }

      for (let p of eliminated) {
        try {
          await malvin.groupParticipantsUpdate(m.chat, [p.id], "remove");
          await malvin.sendMessage(m.chat, {
            text: `❌ @${p.id.split("@")[0]} eliminated for ${isGreenLight ? "not talking on Green Light" : "talking on Red Light"}.`,
            mentions: [p.id]
          });
        } catch {
          // Ignore errors (maybe user left already)
        }
      }

      remainingPlayers = remainingPlayers.filter(p => !eliminated.includes(p));
      if (remainingPlayers.length <= 1) break;

      await delay(5000);
    }

    if (remainingPlayers.length === 1) {
      await malvin.sendMessage(m.chat, {
        text: `🏆 Congratulations @${remainingPlayers[0].id.split("@")[0]}! You survived the Squid Game! 🎉`,
        mentions: [remainingPlayers[0].id]
      });
    } else {
      await malvin.sendMessage(m.chat, { text: "No winners this time, everyone was eliminated!" });
    }

    activeGames.delete(m.chat);
  } catch (e) {
    console.error(e);
    reply("❌ Error occurred while running Squid Game.");
    activeGames.delete(m.chat);
  }
});

// ======= Konami Match with voting =======
malvin({
  pattern: "konami",
  desc: "Simulate a match and let chat vote for winner in 30s",
  category: "fun",
  react: "⚽",
  filename: __filename,
}, async (malvin, mek, m, { reply }) => {
  try {
    if (activeGames.has(m.chat)) return reply("⚠️ A game is already running here!");
    activeGames.set(m.chat, "konami");

    const teams = [
      "Real Madrid 🇪🇸", "FC Barcelona 🇪🇸", "Manchester United 🇬🇧", "Liverpool FC 🇬🇧",
      "Bayern Munich 🇩🇪", "Juventus 🇮🇹", "Paris Saint-Germain 🇫🇷", "Arsenal FC 🇬🇧",
      "AC Milan 🇮🇹", "Inter Milan 🇮🇹", "Chelsea FC 🇬🇧", "Borussia Dortmund 🇩🇪"
    ];

    let team1 = teams[Math.floor(Math.random() * teams.length)];
    let team2;
    do {
      team2 = teams[Math.floor(Math.random() * teams.length)];
    } while (team2 === team1);

    let voteCounts = { [team1]: 0, [team2]: 0 };

    await malvin.sendMessage(m.chat, {
      text: `⚽ *Match Versus*\n\n1️⃣ ${team1}\n2️⃣ ${team2}\n\nReact with 1 or 2 to vote for the winner! You have 30 seconds.`,
    });

    // Listen to votes
    const onVote = (msg) => {
      if (msg.messages[0].key.remoteJid === m.chat) {
        const text = msg.messages[0].message?.conversation || "";
        if (text.trim() === "1") voteCounts[team1]++;
        else if (text.trim() === "2") voteCounts[team2]++;
      }
    };

    malvin.ev.on("messages.upsert", onVote);

    await delay(30000);

    malvin.ev.off("messages.upsert", onVote);

    let winner = voteCounts[team1] > voteCounts[team2] ? team1 :
      voteCounts[team2] > voteCounts[team1] ? team2 :
      Math.random() < 0.5 ? team1 : team2;

    await malvin.sendMessage(m.chat, {
      text: `🏆 *Match Result*\n\nThe winner is... *${winner}*! 🎉\n\nVotes:\n${team1}: ${voteCounts[team1]}\n${team2}: ${voteCounts[team2]}`
    });

    activeGames.delete(m.chat);
  } catch (e) {
    console.error(e);
    reply("❌ Error occurred during Konami match.");
    activeGames.delete(m.chat);
  }
});

// ======= Number Guess Game =======
malvin({
  pattern: "guessnumber",
  desc: "Guess the number (1-20), you have 5 tries",
  category: "fun",
  filename: __filename,
}, async (malvin, mek, m, { reply }) => {
  try {
    if (activeGames.has(m.chat)) return reply("⚠️ A game is already running here!");
    activeGames.set(m.chat, "guessnumber");

    const target = Math.floor(Math.random() * 20) + 1;
    let tries = 5;

    await reply("🎲 Guess the number between 1 and 20! You have 5 tries. Send your guesses now.");

    const onGuess = (msg) => {
      if (msg.messages[0].key.remoteJid === m.chat) {
        let guess = parseInt(msg.messages[0].message?.conversation);
        if (!isNaN(guess)) {
          tries--;
          if (guess === target) {
            malvin.sendMessage(m.chat, { text: `🎉 Congrats @${msg.messages[0].key.participant.split("@")[0]}! You guessed the number ${target} correctly!` });
            malvin.ev.off("messages.upsert", onGuess);
            activeGames.delete(m.chat);
          } else if (tries === 0) {
            malvin.sendMessage(m.chat, { text: `❌ Game over! The number was ${target}. Better luck next time!` });
            malvin.ev.off("messages.upsert", onGuess);
            activeGames.delete(m.chat);
          } else {
            let hint = guess > target ? "Too high!" : "Too low!";
            malvin.sendMessage(m.chat, { text: `❌ Wrong guess. ${hint} Tries left: ${tries}` });
          }
        }
      }
    };

    malvin.ev.on("messages.upsert", onGuess);

  } catch (e) {
    console.error(e);
    reply("❌ Error occurred during Guess Number game.");
    activeGames.delete(m.chat);
  }
});

// ======= Rock Paper Scissors =======
malvin({
  pattern: "rps",
  desc: "Play rock-paper-scissors against the bot",
  category: "fun",
  filename: __filename,
  use: "<rock|paper|scissors>"
}, async (malvin, mek, m, { args, reply }) => {
  try {
    if (!args.length) return reply("Please choose rock, paper or scissors. Example: .rps rock");

    const choices = ["rock", "paper", "scissors"];
    const userChoice = args[0].toLowerCase();

    if (!choices.includes(userChoice)) return reply("Invalid choice! Choose rock, paper or scissors.");

    const botChoice = choices[Math.floor(Math.random() * choices.length)];

    const wins = {
      rock: "scissors",
      paper: "rock",
      scissors: "paper"
    };

    let result = "";
    if (userChoice === botChoice) result = "It's a tie!";
    else if (wins[userChoice] === botChoice) result = "You win! 🎉";
    else result = "You lose! 😢";

    await reply(`You chose: ${userChoice}\nBot chose: ${botChoice}\n\n${result}`);

  } catch (e) {
    console.error(e);
    reply("❌ Error occurred during rock-paper-scissors.");
  }
});

// ======= Tic Tac Toe (basic version) =======
const ticTacToeGames = new Map();

malvin({
  pattern: "tictactoe",
  desc: "Play Tic Tac Toe! Usage: .tictactoe start | .tictactoe move <1-9>",
  category: "fun",
  filename: __filename,
  use: "start | move <pos>"
}, async (malvin, mek, m, { args, reply }) => {
  try {
    const chatId = m.chat;
    if (args.length === 0) return reply("Usage:\n.tictactoe start\n.tictactoe move <1-9>");

    if (args[0] === "start") {
      if (ticTacToeGames.has(chatId)) return reply("Game already in progress!");
      ticTacToeGames.set(chatId, {
        board: Array(9).fill(null),
        turn: "X",
        players: [mek.sender, null], // second player can join by first move
      });
      return reply("Tic Tac Toe started! You are 'X'. Use `.tictactoe move <1-9>` to play.");
    }

    if (args[0] === "move") {
      const game = ticTacToeGames.get(chatId);
      if (!game) return reply("No game in progress! Use `.tictactoe start` to begin.");
      const pos = parseInt(args[1]);
      if (isNaN(pos) || pos < 1 || pos > 9) return reply("Position must be between 1 and 9.");

      if (game.board[pos - 1] !== null) return reply("Position already taken.");

      // Assign second player on first move if null
      if (!game.players[1] && mek.sender !== game.players[0]) {
        game.players[1] = mek.sender;
      }

      if (mek.sender !== game.players[game.turn === "X" ? 0 : 1]) {
        return reply("It's not your turn.");
      }

      game.board[pos - 1] = game.turn;

      // Check winner
      const wins = [
        [0,1,2],[3,4,5],[6,7,8], // rows
        [0,3,6],[1,4,7],[2,5,8], // cols
        [0,4,8],[2,4,6]          // diags
      ];

      let winner = null;
      for (const [a,b,c] of wins) {
        if (game.board[a] && game.board[a] === game.board[b] && game.board[a] === game.board[c]) {
          winner = game.turn;
          break;
        }
      }

      // Draw check
      const isDraw = game.board.every(cell => cell !== null);

      const renderBoard = () => {
        return game.board.map(cell => cell ? cell : "⬜").reduce((acc,row,i) => {
          acc += row + ((i+1)%3 === 0 ? "\n" : "");
          return acc;
        }, "");
      };

      if (winner) {
        reply(`🏆 Player '${winner}' wins!\n\n${renderBoard()}`);
        ticTacToeGames.delete(chatId);
      } else if (isDraw) {
        reply(`🤝 It's a draw!\n\n${renderBoard()}`);
        ticTacToeGames.delete(chatId);
      } else {
        // Switch turn
        game.turn = game.turn === "X" ? "O" : "X";
        reply(`Next turn: Player '${game.turn}'\n\n${renderBoard()}`);
      }
    }
  } catch (e) {
    console.error(e);
    reply("❌ Error occurred in Tic Tac Toe.");
  }
});
