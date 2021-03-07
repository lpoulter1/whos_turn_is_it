require("dotenv").config();
const axios = require("axios").default;
const cheerio = require("cheerio");
const fs = require("fs");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const playerIdMap = {
  lpoulter: "U01PMMBSQSF",
  solon: "U01P6U9RYDV",
  attrill20: "U01PJJZD5J9",
  evilben: "U01PF1BR2AJ",
  jasperb: "U01QF5SH90S",
};

const games = ["3856082", "3853843"];

function scrape() {
  games.map(async (gameId) => {
    await sleep(30000);
    console.log(`Scrapeing game ${gameId} `);
    const gameLink = `http://www.boiteajeux.net/jeux/agr/partie.php?id=${gameId}`;
    const fileName = `last-played-${gameId}.json`;
    let lastPlayedData = fs.readFileSync(fileName);
    let { lastPlayed } = JSON.parse(lastPlayedData);

    https: axios
      .get(gameLink)
      .then(function(response) {
        const $ = cheerio.load(response.data);
        const nextPlayer = $(".clInfo").text();
        let userId = "";
        const players = Object.keys(playerIdMap);
        players.map((player) => {
          if (nextPlayer.toLowerCase().includes(player)) {
            userId = playerIdMap[player];
          }
        });

        try {
          fs.writeFileSync(
            fileName,
            JSON.stringify({ lastPlayed: nextPlayer })
          );
          console.log("Last played json updated");
        } catch (e) {
          console.error(`Updating player json failed: `, e);
        }

        if (nextPlayer !== lastPlayed) {
          console.log(
            `sending notification: nextPlayer: ${nextPlayer}, lastPlayed: ${lastPlayed} userId${userId}`
          );
          axios.post(process.env.TEST_CHANNEL_WEB_HOOK, {
            text: `${nextPlayer} <@${userId}>`,
          });
        } else {
          console.log(`same player ${nextPlayer} not notifiying`);
        }
      })
      .catch(function(error) {
        // handle error
        console.log(error);
        throw error;
      })
      .then(function() {
        // always executed
      });
  });
}

scrape();
