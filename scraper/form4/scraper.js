const request = require("tinyreq");
const Promise = require('bluebird');
const parser = require("xml2js").Parser({explicitArray : false});
const cheerio = require('cheerio');
const _ = require('lodash');

const {
    buildQuerystring,
    parseEntry,
    parseReporterTitle,
    parseNonDerivative,
    parseDerivative,
} = require('./helper');
const {
    saveTicker,
    savePurchase
} = require('../save');

let cache = [];
const defaultOptions = {
    owner: "include",
    count: 100,
    action: "getcurrent",
    output: "atom"
};

const twoMinutes = 120000;
const fourMinutes = 240000;

scrape(defaultOptions);
setInterval(() => {
    console.log('SCRAPED!');
    scrape(defaultOptions);     
}, (Math.floor(Math.random() * (fourMinutes - twoMinutes)) + twoMinutes));

function scrape(options = {}) {
    const queryString = buildQuerystring(options);
    requestFeed(queryString);
}

function requestFeed(query) {
    request(query, function (err, body) {
        if (err) {
            console.log('REQUEST FEED ERROR: ', err);
            return;
        }

        parser.parseString(body, (err, result) => {
            const entries = result.feed.entry;
            parseEntries(entries);
        });
    });
}

//Loop for each of the entries that are returned
function parseEntries(entries) {      
    Promise.map(entries, (entry) => {
        const parsedEntry = parseEntry(entry);
        return parsedEntry;
    }).map(entry => {               
        if (entry.form === '4' && entry.role === 'Reporting') {                                    
            parseForm4Url(entry);            
        }
    });
}

function parseForm4Url(entry) {    
    request(entry.url, function (err, body) {
        if (err) {
            console.log('PARSE FORM 4 URL ERROR: ', err);
            return;
        }        
        const $ = cheerio.load(body);
        const xmlLinkKey = $('.blueRow a').first().text();        
        const last = entry.url.split('/').pop(-1);
        const parsedUrl = entry.url.replace(last, xmlLinkKey);        
        parseForm4(parsedUrl, entry);
    });
}

function parseForm4(url, entry) {        
    request(url, function (err, body) {
        if (err) {
            console.log('PARSE FORM 4 ERROR: ', err);
            return;
        }        
        parser.parseString(body, (err, result) => {            
            filterForm4(result, entry);            
        });
    });
}

function filterForm4(form4, entry) {    
    form4 = form4.ownershipDocument;

    const reporter = entry.name;
    const company = form4.issuer.issuerName;
    const ticker = form4.issuer.issuerTradingSymbol;
    const reporterTitle = parseReporterTitle(form4);
    const cik = entry.cik;
    const form4Link = entry.url;
    const accessionNumber = entry.accessionNumber;    
    const derivativeTransaction = parseDerivative(form4);
    const nonDerivativeTransaction = parseNonDerivative(form4);

    const purchaseInformation = {        
        ticker, 
        company,         
        reporter,
        reporterTitle,          
        cik,         
        accessionNumber,
        url: form4Link
    };

    const finalValueDer = Object.assign(purchaseInformation, derivativeTransaction);
    const finalValueNonDer = Object.assign(purchaseInformation, nonDerivativeTransaction);     

    if (!_.isEmpty(nonDerivativeTransaction)) {        
        savePurchase(finalValueNonDer);
        console.log(finalValueNonDer);
    }

    if (!_.isEmpty(derivativeTransaction)) {
        savePurchase(finalValueDer);
        console.log(finalValueDer);
    }
}