const RecentScraper = require('./recentScraper');
const PastScraper = require('./pastScraper');

const twoMinutes = 120000;
const fourMinutes = 240000;
const thirtySeconds = 30000;
const oneMinute = 60000;

const newFeedBaseUrl = "https://www.sec.gov/cgi-bin/browse-edgar";
const newFeedScrapeOptions = {
    owner: "include",
    count: 100,
    action: "getcurrent",
    output: "atom"
};

const oldFeedBaseUrl = "https://www.sec.gov/cgi-bin/srch-edgar";
const oldFeedScrapeOptions = {
    text: "form-type=4",
    first: "2016",
    last: "2017",
    output: "atom",
    start: 1,
    count: 80
};

//https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&count=100&output=atom&owner=include
const newFeedScraper = new RecentScraper();
newFeedScraper.scrape(newFeedScrapeOptions, newFeedBaseUrl);
setInterval(() => {    
    newFeedScraper.scrape(newFeedScrapeOptions, newFeedBaseUrl);
}, (Math.floor(Math.random() * (fourMinutes - twoMinutes)) + twoMinutes));

//https://www.sec.gov/cgi-bin/srch-edgar?text=form-type=4&first=2016&last=2017&output=atom&start=161&count=80
// const oldFeedScraper = new PastScraper();
// oldFeedScraper.scrape(oldFeedScrapeOptions, oldFeedBaseUrl);
// const oldFeedLoop = setInterval(() => {
//     oldFeedScrapeOptions.start += 80;
//     if (oldFeedScrapeOptions.start >= 10000) {
//         clearInterval(oldFeedLoop);
//     }
//     oldFeedScraper.scrape(oldFeedScrapeOptions, oldFeedBaseUrl);
// }, (Math.floor(Math.random() * (oneMinute - thirtySeconds)) + oneMinute));

