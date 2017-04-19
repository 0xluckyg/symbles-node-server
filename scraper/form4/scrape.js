//https://www.sec.gov/cgi-bin/srch-edgar?text=form-type=4&first=2016&last=2017&output=atom&start=161&count=80

const Scraper = require('./scraper');

const twoMinutes = 120000;
const fourMinutes = 240000;

const newFeedBaseUrl = "https://www.sec.gov/cgi-bin/browse-edgar";
const newFeedScrapeOptions = {
    owner: "include",
    count: 100,
    action: "getcurrent",
    output: "atom"
};

const oldFeedBaseUrl = "https://www.sec.gov/cgi-bin/srch-edgar";
const oldFeedScrapeOptions = {
    owner: "include",

};

const newFeedScraper = new Scraper();

newFeedScraper.scrape(newFeedScrapeOptions, newFeedBaseUrl);
setInterval(() => {
    console.log('SCRAPED!');
    newFeedScraper.scrape(newFeedScrapeOptions, newFeedBaseUrl);
}, (Math.floor(Math.random() * (fourMinutes - twoMinutes)) + twoMinutes));

// const oldFeedScraper = new Scraper();

