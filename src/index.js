// require('dotenv').config()
const axios = require("axios").default;
const cheerio = require("cheerio");

const gameId = `3851196`;
const gameLink = `http://www.boiteajeux.net/jeux/agr/partie.php?id=${gameId}`;

const lastPlayer = '';
const playerIdMap = { 'lpoulter': 'U01PMMBSQSF' }

https: axios
  .get(gameLink)
  .then(function(response) {
    const $ = cheerio.load(response.data);
    const nextPlayer = $(".clInfo").text();

    if(nextPlayer !== lastPlayer) {
        axios.post(
          process.env.AGRICOLA_NOTIFICATION_CHANNEL_WEB_HOOK,       
            { text: `${nextPlayer} <@U01PMMBSQSF>` }
          );
    }
  })
  .catch(function(error) {
    // handle error
    console.log(error);
  })
  .then(function() {
    // always executed
  });
