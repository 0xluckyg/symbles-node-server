const request = require("tinyreq");
const parser = require("xml2js").Parser({explicitArray : false});
const cheerio = require('cheerio');
const async = require('async');
const moment = require('moment');
const _ = require('lodash');

const baseUrl = "https://www.sec.gov/cgi-bin/browse-edgar";
const defaultOptions = {
    owner: "include",
    count: 100,
    action: "getcurrent",
    output: "atom"
};

scrape();

function scrape(options = {}) {
    const queryString = buildQuerystring(options);
    requestFeed(queryString);
}

//?action=getcurrent&count=100&output=atom&owner=include by default
function buildQuerystring(options = {}) {
    options = Object.assign(defaultOptions, options);
    const optionsArray = Object.keys(options).map(key => {
        return key + '=' + options[key];
    });
    return baseUrl + '?' + optionsArray.join('&');
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
    console.log(entries);
    let index = 0;

    entries.forEach(entry => {
        const parsedEntry = parseEntry(entry);
        if (parsedEntry.form === '4' && parsedEntry.role === 'Reporting') {                                    
            parseForm4Url(parsedEntry);
        }
    });

    // async.whilst(() => {
    //     return index < entries.length;
    // }, (next) => {
    //     console.log(index);        
    //     const parsedEntry = parseEntry(entries[index]);        
    //     console.log(parsedEntry.accessionNumber);
    //     if (parsedEntry.form === '4' && parsedEntry.role === 'Reporting') {                        
    //         index++;
    //         parseForm4Url(parsedEntry, next);
    //     } else {
    //         //Skip if the form is not 4 or of 'reporting'
    //         index++;
    //         next();
    //     }
    // }, (err) => {
    //     if (err) { console.log('PARSE ENTRIES ERROR: ', err); }
    // });
}

function parseForm4Url(entry, next) {        
    request(entry.url, function (err, body) {
        if (err) {
            console.log('PARSE FORM 4 URL ERROR: ', err);
            return;
        }

        const $ = cheerio.load(body);
        const xmlLinkKey = $('.blueRow a').first().text();
        // console.log(entry.url);
        const last = entry.url.split('/').pop(-1);
        const parsedUrl = entry.url.replace(last, xmlLinkKey);
        parseForm4(parsedUrl, entry, next);
    });
}

function parseForm4(url, entry, next) {    
    request(url, function (err, body) {
        if (err) {
            console.log('PARSE FORM 4 ERROR: ', err);
            return;
        }

        parser.parseString(body, (err, result) => {
            filterForm4(result, entry, url, next);
        });
    });
}

function filterForm4(form4, entry, url, next) {    
    form4 = form4.ownershipDocument;

    const company = form4.issuer.issuerName;
    const ticker = form4.issuer.issuerTradingSymbol;
    const reporterTitle = parseReporterTitle(form4);
    const cik = entry.cik;
    const form4Link = entry.url;
    const accessionNumber = entry.accessionNumber;

    console.log("#######################################", company, form4Link);
    const derivativeTransaction = parseDerivative(form4);
    const nonDerivativeTransaction = parseNonDerivative(form4);

    const purchaseInformation = {
        ticker, 
        company,         
        reporterTitle,          
        cik,         
        accessionNumber,
        url: form4Link
    };

    const finalValueDer = Object.assign(purchaseInformation, derivativeTransaction);
    const finalValueNonDer = Object.assign(purchaseInformation, nonDerivativeTransaction);

    if (!_.isEmpty(nonDerivativeTransaction)) {
        console.log(finalValueNonDer);
    }

    // next();
}

// funciton saveToDatabase() {
    
// }

//HELPERS
function parseEntry(entry) {
    const formSubjectCikRole = parseTitle(entry);
    const accessionNumber = parseAccessionNumber(entry);
    const url = entry.link.$.href;
    return Object.assign(formSubjectCikRole, {accessionNumber,url});
}

function parseTitle(entry) {
    const regex = /(.+) - ([\w .,&-\/]+) \(([0-9]+)\) \((.+)\)/;
    const _ = entry.title.match(regex);
    return {form: _[1], name: _[2], cik: _[3], role: _[4]};
}

function parseAccessionNumber(entry) {
    const regex = /[a-z].+accession-number=([0-9-]+)/;
    const accessionNumber = entry.id.match(regex)[1];
    return accessionNumber;
}

function parseReporterTitle(form4) {    

    let relationships;
    if (form4.reportingOwner.constructor === Array) {
        relationships = form4.reportingOwner[0].reportingOwnerRelationship;
    } else {
        relationships = form4.reportingOwner.reportingOwnerRelationship;
    }        

    if (relationships.officerTitle !== undefined && relationships.officerTitle !== '') {
        return relationships.officerTitle;
    }

    if (relationships.isDirector === '1' && relationships.isOfficer === '1') {
        return 'Director and officer';
    }

    if (relationships.isDirector === '1') {
        return 'Director';
    }

    if (relationships.isOfficer === '1') {
        return 'Officer';
    }

    if (relationships.isTenPercentOwner === '1') {
        return 'Ten percent owner';
    }

    if (relationships.isOther === '1') {
        return 'Other';
    }
}

function parseNonDerivative(form4) {
    console.log('NONDER');
    if (form4.nonDerivativeTable) {        
        const transactions = form4.nonDerivativeTable.nonDerivativeTransaction;                        
        return extractPurchaseData(transactions);
    }
    return {};
}

function parseDerivative(form4) { 
    console.log('DER');
    if (form4.derivativeTable) {         
        const transactions = form4.derivativeTable.derivativeTransaction;
        return extractPurchaseData(transactions);
    }
    return {};
}

function extractPurchaseData(transactions) {
    if (transactions === undefined) { return; }
    
    let transactionSum = {};
    if (transactions !== undefined && transactions.constructor === Array) {        
        let numberOfItems = 1;
        transactions.forEach(transaction => {                                
            transaction = formatPurchaseData(transaction);                                
            if (transaction.transactionCode === 'P') {
                if (_.isEmpty(transactionSum)) {
                    transactionSum = transaction;
                    return;
                }
                
                transactionSum.transactionAmount += transaction.transactionAmount;
                transactionSum.transactionPrice += transaction.transactionPrice;
            }
            numberOfItems++;
        });
        if (!_.isEmpty(transactionSum)) {
            transactionSum.transactionPrice = transactionSum.transactionPrice / numberOfItems;
        }        
    } else {              
        if (transactions.transactionCode === 'P') {
            transactionSum = formatPurchaseData(transactions);
        }
    }

    console.log(transactionSum);
    return transactionSum;
}

function formatPurchaseData(transaction) {
    const securityTitle = transaction.securityTitle.value;//RETURNED
    let transactionDate = transaction.transactionDate.value;
    transactionDate = moment(transactionDate, "YYYY-MM-DD");//RETURNED
    const transactionCode = transaction.transactionCoding.transactionCode;//RETURNED
    const numberOfShares = parseInt(transaction.transactionAmounts.transactionShares.value);
    const transactionPrice = parseFloat(transaction.transactionAmounts.transactionPricePerShare.value);
    const transactionAmount = numberOfShares * transactionPrice;//RETURNED
    const ownershipNature = transaction.ownershipNature.directOrIndirectOwnership.value;//RETURNED

    return {securityTitle, transactionDate, transactionCode, transactionAmount, transactionPrice, ownershipNature};
}