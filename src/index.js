require('dotenv').config()
const axios = require("axios").default;
const cheerio = require("cheerio");
const fs = require("fs");

const gameId = `3851196`;
const gameLink = `http://www.boiteajeux.net/jeux/agr/partie.php?id=${gameId}`;

const playerIdMap = { 'lpoulter': 'U01PMMBSQSF', 'solon': 'U01P6U9RYDV', 'attrill20': 'U01PJJZD5J9', 'evilben': 'U01PF1BR2AJ' }

let lastPlayedData = fs.readFileSync('last-played.json');
let { lastPlayed } = JSON.parse(lastPlayedData);

https: axios
  .get(gameLink)
  .then(function(response) {
    const $ = cheerio.load(response.data);
    const nextPlayer = $(".clInfo").text();
    let userId = '';
    const players = Object.keys(playerIdMap);
    players.map(player => {
      if(nextPlayer.toLowerCase().includes(player)) {
        userId = playerIdMap[player]
      }
    })

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
      console.log(`sending notification: nextPlayer: ${nextPlayer}, lastPlayed: ${lastPlayed} userId${userId}`)
        axios.post(
          process.env.AGRICOLA_NOTIFICATION_CHANNEL_WEB_HOOK,       
            { text: `${nextPlayer} <@${userId}>` }
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
