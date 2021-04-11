const puppeteer = require("puppeteer");
const fs = require("fs");

function writeLastPlayedToDisk(fileName, lastPlayed = "") {
  try {
    fs.writeFileSync(fileName, JSON.stringify({ lastPlayed }));
    console.log("Last played json updated");
  } catch (error) {
    console.error(`Updating player json failed: `, e);
  }
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const tableId = "162693887";
  const gameUrl = `https://boardgamearena.com/9/terramystica?table=${tableId}`;
  await page.goto(gameUrl);
  await page.waitForSelector("#pagemaintitletext");

  const turnString = await page.evaluate(() => {
    const turnString = document.querySelector("#pagemaintitletext").textContent;
    return turnString;
  });

  writeLastPlayedToDisk(`${tableId}.json`, turnString);

  await browser.close();
})();
