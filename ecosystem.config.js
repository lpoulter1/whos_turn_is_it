module.exports = {
  apps: [
    {
      name: "scrapeAgricola",
      script: "./src/index.js",
      logDateFormat: 'DD-MM HH:mm:ss.SSS',
      restart_delay: 60000,
    },
    {
      name: "scrapeBga",
      script: "./src/scrapeBga.js",
      logDateFormat: 'DD-MM HH:mm:ss.SSS',
      restart_delay: 60000,
    },
  ],
};
