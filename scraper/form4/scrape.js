const RecentScraper = require('./recentScraper');

const twoMinutes = 120000;
const fourMinutes = 240000;
const thirtySeconds = 30000;
const oneMinute = 60000;

const newFeedBaseUrl = "https://www.sec.gov/cgi-bin/browse-edgar";
const newFeedScrapeOptions = {
    owner: "include",
    count: 100,
    action: "getcurrent",
    output: "atom",
    type: 4
};

//https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&count=100&owner=include&output=atom
function scrape() {
    const newFeedScraper = new RecentScraper();
    newFeedScraper.scrape(newFeedScrapeOptions, newFeedBaseUrl);
    setInterval(() => {   
        console.log('SCRAPED!');
        newFeedScraper.scrape(newFeedScrapeOptions, newFeedBaseUrl);
    }, (Math.floor(Math.random() * (fourMinutes - twoMinutes)) + twoMinutes));
}

module.exports = {
    scrape
};