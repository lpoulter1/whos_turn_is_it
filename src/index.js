// require('dotenv').config()
const axios = require("axios").default;
const cheerio = require("cheerio");
const fs = require("fs");

const gameId = `3851196`;
const gameLink = `http://www.boiteajeux.net/jeux/agr/partie.php?id=${gameId}`;

const playerIdMap = { 'lpoulter': 'U01PMMBSQSF' }


let lastPlayedData = fs.readFileSync('last-played.json');
let lastPlayed = JSON.parse(lastPlayedData);

https: axios
  .get(gameLink)
  .then(function(response) {
    const $ = cheerio.load(response.data);
    const nextPlayer = $(".clInfo").text();

  try {
    fs.writeFileSync(
      'last-played.json',
      JSON.stringify({lastPlayed: nextPlayer})
    );
    console.log("Last played json updated");
  } catch (e) {
    console.error(`Updating player json failed: `, e);
  }

    if(nextPlayer !== lastPlayed) {
        axios.post(
          process.env.AGRICOLA_NOTIFICATION_CHANNEL_WEB_HOOK,       
            { text: `${nextPlayer} <@U01PMMBSQSF>` }
          );
    } else {
      console.log('same player not notifiying')
    }
  })
  .catch(function(error) {
    // handle error
    console.log(error);
    throw(error);
  })
  .then(function() {
    // always executed
  });
