const { Client } = require("discord-rpc");
const fs = require("fs");
const path = require("path");
const argv = require("yargs").argv;
const term = require("terminal-kit");

process.on("SIGINT", function () {
  console.log("\nGracefully shutting down from SIGINT (Ctrl-C)");
  // some other closing procedures go here
  process.exit(1);
});
const game = argv.game;
/**
 * @type {{ clientId: string, party: any, presence: { details: string, state: string, largeImageKey: string, largeImageText: string, smallImageKey: string, smallImageText: string } }}
 */
let gameData;
if (game) {
  const gamePath = path.resolve("games/" + game + ".json");
  if (!fs.existsSync(gamePath)) {
    console.error("Game json does not exist (" + gamePath + ")");
    return;
  }
  gameData = JSON.parse(fs.readFileSync(gamePath).toString());
  let clientId = gameData.clientId;
}

let client = new Client({ transport: "ipc" });
let startTimestamp = new Date();
async function setActivity() {
  if (!client || !gameData) {
    return;
  }

  client.setActivity({
    state: gameData.presence.state,
    startTimestamp,
    details: gameData.presence.details,
    largeImageKey: gameData.presence.largeImageKey,
    largeImageText: gameData.presence.largeImageText,
    smallImageKey: gameData.presence.smallImageKey,
    smallImageText: gameData.presence.smallImageText,
    ...gameData.party,
    instance: false,
  });
}
client.on("ready", () => {
  setActivity();
  // activity can only be set every 15 seconds
  setInterval(() => {
    setActivity();
  }, 15e3);
});

// Log in to RPC with client id
if (gameData && gameData.clientId) {
  client.login({ clientId: gameData.clientId }).then(x => {
  }).catch(err => {
      console.error(err);
  });
}
console.clear();
const main = term.createTerminal({
  appName: "Discord Rich Presence",
  appId: "discord.rpc-utility",
});
const files = fs
  .readdirSync("games/")
  .filter((x) => x.endsWith(".json"))
  .map((x) => ({ key: path.basename(x), value: x }));
function openMenu() {
  main
    .singleColumnMenu(
      files.map((x) => x.key),
      {
        oneLineItem: true,
        cancelable: true,
        continueOnSubmit: false,
      }
    )
    .promise.then((x) => {
      if (x.canceled) {
        process.exit();
        return;
      }
      var file = files[x.selectedIndex];
      gameData = JSON.parse(
        fs.readFileSync(path.resolve("games/" + file.value)).toString()
      );
      startTimestamp = new Date();
      client
        .login({ clientId: gameData.clientId })
        .then((x) => {})
        .catch();
      console.clear();
      openMenu();
    })
    .catch((err) => console.error(err));
}
openMenu();
