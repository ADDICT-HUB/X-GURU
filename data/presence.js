// data/presence.js
module.exports = {
  PresenceControl: function(sock, update) {
    console.log("PresenceControl called");
  },
  BotActivityFilter: function(sock) {
    console.log("BotActivityFilter called");
  }
};
