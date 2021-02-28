const axios = require('axios').default;
const cheerio = require("cheerio");

const gameId = `3851196`;
const gameLink = `http://www.boiteajeux.net/jeux/agr/partie.php?id=${gameId}`;

axios.get(gameLink)
  .then(function (response) {
    const $ = cheerio.load(response.data);
    const nextPlayer = $('.clInfo').text();
    console.log(nextPlayer);
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .then(function () {
    // always executed
  });
