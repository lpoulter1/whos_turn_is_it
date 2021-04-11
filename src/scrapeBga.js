require("dotenv").config();
const fs = require("fs");
const puppeteer = require("puppeteer");
const axios = require("axios").default;

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

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const tableId = "162693887";
  const fileName = `last-played-terra-mystica-${tableId}.json`;
  const gameUrl = `https://boardgamearena.com/9/terramystica?table=${tableId}`;
  await page.goto(gameUrl);
  await page.waitForSelector("#pagemaintitletext");

  const lastPlayed = getLastPlayed({ tableId, fileName });
  const nextPlayer = await page.evaluate(() => {
    const turnString = document.querySelector("#pagemaintitletext").textContent;
    return turnString;
  });

  if (nextPlayer !== lastPlayed) {
    writeLastPlayedToDisk(fileName, nextPlayer);
    axios.post(process.env.TEST_CHANNEL_WEB_HOOK, {
      text: `${nextPlayer} \n ${gameUrl}`,
    });
  }

  await browser.close();
})();
