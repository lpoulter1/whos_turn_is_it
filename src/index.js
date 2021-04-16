require("dotenv").config();
const axios = require("axios").default;
const cheerio = require("cheerio");
const fs = require("fs");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getGameName($) {
  const match = $("#dvEnteteInfo")
    .text()
    .match(/"(?<gameName>.*?)"/);

  if (!match) {
    console.log("no game name found");
    gameName = "The game with no name";
  } else {
    gameName = match.groups.gameName;
  }

  return gameName;
}

function notifyDraftRoundStarted($, lastPlayed, fileName, gameName, gameLink) {
  const tableData = getDraftTableData($);

  const notificationString = tableData.map((row, index) => {
    const [th, td] = row;
    if (index === 0) {
      return `${th}: ${td}`;
    }
    const userId = mapBoiteajeuxToSlackId(row[0]);
    return `<@${userId}>, ${row[1]}`;
  });

  console.log("notificationString", notificationString);

  const [currentRoundNumber] = notificationString;
  console.log("lastPlayed", lastPlayed);
  console.log("currentRoundNumber", currentRoundNumber);
  if (currentRoundNumber !== lastPlayed) {
    console.log("updating to round number: ", currentRoundNumber);
    writeLastPlayedToDisk(fileName, currentRoundNumber);

    console.log(`sending draft notification`);

    axios.post(process.env.AGRICOLA_NOTIFICATION_CHANNEL_WEB_HOOK, {
      text: `<${gameLink}|Game: ${gameName} ↗️> \n ${notificationString.join(
        "\n"
      )}`,
    });
  } else {
    console.log(`same round ${currentRoundNumber} not notifiying`);
  }
}

function getDraftTableData($) {
  const draftTable = $("span:contains('Draft')").closest("table");
  if (draftTable.length === 0) {
    return console.log("not drafting");
  }
  console.log("is drafting");
  let tableData = [];
  $(draftTable)
    .find("tbody tr")
    .each((i, tr) => {
      const $th = $(tr).find("th");
      const $td = $(tr).find("td");
      tableData.push([
        $th
          .text()
          .trim()
          .toLowerCase(),
        $td
          .text()
          .trim()
          .toLowerCase(),
      ]);
    });

  return tableData;
}

const playerIdMap = {
  lpoulter: "U01PMMBSQSF",
  solon: "U01P6U9RYDV",
  attrill20: "U01PJJZD5J9",
  evilben: "U01PF1BR2AJ",
  jasperb: "U01QF5SH90S",
  boardello: "U01QH19H3MG",
  hehasmoments: "U01QUCAEWQL",
  peskygekko: "U01QQJ4HDNH",
  jonnydl: "U01RLSYG8SU",
  circadia: "U01R35GC9HS",
  tf13041: "U01QX3F75EF",
  sixtyten: "U01R5JV23EH",
  nemamiah: "U01RC031AE9",
  rusefus: "U01R8MFEHAN",
  spjmacleod: "U01S3QY3ADB",
  hilson: "U01SJRG22S1",
  cacoethesvictor: "U01SV6F7ECS"
};

function mapBoiteajeuxToSlackId(boiteajeuxString) {
  const slackIdKey = Object.keys(playerIdMap).find((player) => {
    return boiteajeuxString.toLowerCase().includes(player);
  });

  if (!slackIdKey) {
    console.log("Slack User not found in String: ", boiteajeuxString);
  }

  return playerIdMap[slackIdKey] || "";
}

function isGameOver($) {
  return $(".clTexteFort:contains('won by')").length > 0;
}

function getWinner($) {
  return $(".clTexteFort:contains('won by')").text();
}

function isDrafting($) {
  const draftTable = $("span:contains('Draft')").closest("table");
  return draftTable.length > 0;
}

function writeLastPlayedToDisk(fileName, lastPlayed = "") {
  try {
    fs.writeFileSync(fileName, JSON.stringify({ lastPlayed }));
    console.log("Last played json updated");
  } catch (error) {
    console.error(`Updating player json failed: `, e);
  }
}

const games = [
  "3856020",
  "3858350",
  "3869972",
  "3876281"
];

function scrape() {
  games.map(async (gameId) => {
    await sleep(30000);
    console.log(`Scraping game ${gameId} `);
    const gameLink = `http://www.boiteajeux.net/jeux/agr/partie.php?id=${gameId}`;
    const fileName = `last-played-${gameId}.json`;

    let lastPlayedData;

    try {
      lastPlayedData = fs.readFileSync(fileName);
    } catch (error) {
      console.log(`Creating JSON file for game ${gameId} `);
      writeLastPlayedToDisk(fileName, "");
    }

    let { lastPlayed = "" } = JSON.parse(lastPlayedData);

    https: axios
      .get(gameLink)
      .then(function(response) {
        const $ = cheerio.load(response.data);
        const gameName = getGameName($);

        if (isGameOver($)) {
          const winnerString = getWinner($);
          if (winnerString !== lastPlayed) {
            console.log("game over ", winnerString);
            writeLastPlayedToDisk(fileName, winnerString);
            axios.post(process.env.AGRICOLA_CHANNEL_WEB_HOOK, {
              text: `🏆 *${gameName}*: *${winnerString}* 🏆`,
            });
          } else {
            console.log('Winner already notified, delete the game Id');
          }
        }

        if (isDrafting($)) {
          return notifyDraftRoundStarted(
            $,
            lastPlayed,
            fileName,
            gameName,
            gameLink
          );
        }

        const nextPlayer = $(".clInfo").text();

        if (!nextPlayer) {
          console.log("No next player found");
          return;
        }

        let userId = "";
        const players = Object.keys(playerIdMap);
        players.map((player) => {
          if (nextPlayer.toLowerCase().includes(player)) {
            userId = playerIdMap[player];
          }
        });

        writeLastPlayedToDisk(fileName, nextPlayer);

        if (nextPlayer !== lastPlayed) {
          console.log(
            `sending notification: nextPlayer: ${nextPlayer}, lastPlayed: ${lastPlayed} userId${userId}`
          );
          axios.post(process.env.AGRICOLA_NOTIFICATION_CHANNEL_WEB_HOOK, {
            text: `${nextPlayer} \n <${gameLink}|Game: ${gameName} ↗️> \n <@${userId}>`,
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
