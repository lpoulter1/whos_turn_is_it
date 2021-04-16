require("dotenv").config();
const fs = require("fs");
const puppeteer = require("puppeteer");
const axios = require("axios").default;

const playerIdMap = {
  lpoulter: "U01PMMBSQSF",
  rusefus: "U01R8MFEHAN",
  cacoethesvictor: "U01SV6F7ECS",
  drtim84: "U01QX3F75EF",
  ["zapp brannigan1"]: "U01TZTZMHFD",
  laplange: "U01TT5S9HAS",
};

const gameIds = ["163263601", "163847032"];

function mapNextPlayerStringToSlackId(nextPlayerString) {
  const slackIdKey = Object.keys(playerIdMap).find((player) => {
    return nextPlayerString.toLowerCase().includes(player);
  });

  if (!slackIdKey) {
    console.log("Slack User not found in String: ", nextPlayerString);
  }

  return playerIdMap[slackIdKey] || "Not on Slack";
}

function writeLastPlayedToDisk(fileName, lastPlayed = "") {
  try {
    fs.writeFileSync(fileName, JSON.stringify({ lastPlayed }));
    console.log("Last played json updated");
  } catch (error) {
    console.error(`Updating player json failed: `, e);
  }
}

function getLastPlayed({ tableId, fileName }) {
  let lastPlayedData;
  let lastPlayed = "";

  try {
    lastPlayedData = fs.readFileSync(fileName);
    lastPlayed = JSON.parse(lastPlayedData).lastPlayed;
  } catch (error) {
    console.log(`Creating JSON file for game ${tableId} `);
    writeLastPlayedToDisk(fileName, "");
  }

  return lastPlayed;
}

async function getGameData(browser, tableId) {
  console.log("Scraping game:", tableId);
  const page = await browser.newPage();
  const fileName = `last-played-terra-mystica-${tableId}.json`;
  const gameUrl = `https://boardgamearena.com/9/terramystica?table=${tableId}`;
  await page.goto(gameUrl);
  await page.waitForSelector("#pagemaintitletext");

  const lastPlayed = getLastPlayed({ tableId, fileName });
  const nextPlayer = await page.evaluate(() => {
    const turnString = document.querySelector("#pagemaintitletext").textContent;
    return turnString;
  });

  const activePlayers = await page.evaluate(() => {
    function getActivePlayers() {
      function isHidden(el) {
        return el && el.offsetParent === null;
      }

      const playerBoards = Array.from(
        document.querySelectorAll(".player_board_inner")
      );

      let activePlayers = [];
      for (const playerBoard of playerBoards) {
        const name =
          playerBoard.querySelector(".player-name") &&
          playerBoard.querySelector(".player-name").innerText;
        if (!name) {
          activePlayers = activePlayers;
        } else {
          const isActive = !isHidden(
            playerBoard.querySelector(".avatar_active").parentNode
          );

          if (isActive) activePlayers.push(name);
        }
      }

      return activePlayers;
    }

    return getActivePlayers();
  });

  console.log("active players: ", activePlayers);
  console.log(`nextPlayer: ${nextPlayer} for game ${tableId}`);

  if (nextPlayer !== lastPlayed) {
    const userIds = activePlayers
      .filter((playerName) => !lastPlayed.includes(playerName))
      .map((playerName) => mapNextPlayerStringToSlackId(playerName));

    const userIdString = userIds.map(id => `<@${id}> \n`);
    const gameName = "terra-mystica";

    writeLastPlayedToDisk(fileName, nextPlayer);
    axios.post(process.env.AGRICOLA_NOTIFICATION_CHANNEL_WEB_HOOK, {
      text: `*${nextPlayer}* \n <${gameUrl}|Game: ${gameName} ↗️> \n ${userIdString}`,
    });
  }
}

const getAllGameData = async (browser) => {
  return Promise.all(gameIds.map((tableId) => getGameData(browser, tableId)));
};

(async () => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  await getAllGameData(browser);
  console.log("closing browser");
  await browser.close();
})();
