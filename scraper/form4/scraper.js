const request = require("tinyreq");
const parser = require("xml2js").Parser({explicitArray : false});
const cheerio = require('cheerio');
const async = require('async');

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
    let index = 0;
    async.whilst(() => {
        return index < entries.length;
    }, (next) => {
        const parsedEntry = parseEntry(entries[index]);
        if (parsedEntry.form === '4' && parsedEntry.role === 'Reporting') {
            index++;
            parseForm4Url(parsedEntry, next);
        } else {
            //Skip if the form is not 4 or of 'reporting'
            index++;
            next();
        }
    }, (err) => {
        if (err) { console.log('PARSE ENTRIES ERROR: ', err); }
    });
}

function parseForm4Url(entry, next) {
    console.log(entry);
    request(entry.url, function (err, body) {
        if (err) {
            console.log('PARSE FORM 4 URL ERROR: ', err);
            return;
        }

        const $ = cheerio.load(body);
        const xmlLinkKey = $('.blueRow a').first().text();
        const last = entry.url.split('/').pop(-1);
        const parsedUrl = entry.url.replace(last, xmlLinkKey);
        parseForm4(parsedUrl, next);
    });
}

function parseForm4(url, next) {
    request(url, function (err, body) {
        if (err) {
            console.log('PARSE FORM 4 ERROR: ', err);
            return;
        }

        parser.parseString(body, (err, result) => {
            filterForm4(result, next);
        });
    });
}

function filterForm4(form4, next) {
    form4 = form4.ownershipDocument;
    const company = form4.issuer.issuerName;
    const ticker = form4.issuer.issuerTradingSymbol;
    const reporterTitle = parseReporterTitle(form4);
    parseDerivative(form4);
    parseNonDerivative(form4);

    next();
}

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
    const relationships = form4.reportingOwner.reportingOwnerRelationship;
    if (relationships.officerTitle) {
        return relationships;
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
    if (form4.nonDerivativeTable) {
        const transactions = form4.nonDerivativeTable.nonDerivativeTransaction;
        if (transactions.constructor === Array) {
            transactions.forEach(transaction => {
                console.log(transaction);
            });
        } else {

        }
    }
}

function parseDerivative(form4) {
    if (form4.derivativeTable) {
        const transactions = form4.derivativeTable.derivativeTransaction;
        if (transactions.constructor === Array) {
            transactions.forEach(transaction => {
                console.log(transaction);
            });
        } else {

        }
    }
}
