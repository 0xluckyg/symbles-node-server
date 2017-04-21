
const moment = require('moment');
const _ = require('lodash');

const defaultOptions = {
    owner: "include",
    count: 100,
    action: "getcurrent",
    output: "atom"
};

//HELPERS
//?action=getcurrent&count=100&output=atom&owner=include by default
function buildQuerystring(options = defaultOptions, base) {    
    const optionsArray = Object.keys(options).map(key => {
        return key + '=' + options[key];
    });    
    const url = base + '?' + optionsArray.join('&');
    console.log(url);
    return url;
}

function parseEntry(entry) {
    const formSubjectCikRole = parseTitle(entry);
    const accessionNumber = parseAccessionNumber(entry);
    const url = entry.link.$.href;
    return Object.assign(formSubjectCikRole, {accessionNumber,url});
}

function parseTitle(entry) {         
    const regex = /(.+) - ([\w #.,&-\/\\]+) \(([0-9]+)\) \((.+)\)/;
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
        return '10% owner';
    }

    if (relationships.isOther === '1') {
        return 'Other';
    }
}

function parseNonDerivative(form4) {
    if (form4.nonDerivativeTable) {        
        const transactions = form4.nonDerivativeTable.nonDerivativeTransaction;                        
        return extractPurchaseData(transactions);
    }
    return {};
}

function parseDerivative(form4) {     
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

            if (transaction.transactionCode === 'S') {
                if (_.isEmpty(transactionSum)) {
                    transactionSum = transaction;
                    transactionSum.transactionAmount = transactionSum.transactionAmount * -1;
                    return;
                }
                
                transactionSum.transactionAmount -= transaction.transactionAmount;
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

        if (transactions.transactionCode === 'S') {
            transactionSum = formatPurchaseData(transactions);
            transactionSum.transactionAmount = transactionSum.transactionAmount * -1;
        }
    }

    return transactionSum;
}

function formatPurchaseData(transaction) {
    const securityTitle = transaction.securityTitle.value;//RETURNED    
    const transactionCode = transaction.transactionCoding.transactionCode;//RETURNED
    const numberOfShares = parseInt(transaction.transactionAmounts.transactionShares.value);
    const transactionPrice = parseFloat(transaction.transactionAmounts.transactionPricePerShare.value);
    const transactionAmount = numberOfShares * transactionPrice;//RETURNED
    const ownershipNature = transaction.ownershipNature.directOrIndirectOwnership.value;//RETURNED
    let date = transaction.transactionDate.value;
    date = moment(date, "YYYY-MM-DD");//RETURNED

    return {securityTitle, date, transactionCode, transactionAmount, transactionPrice, ownershipNature};
}

module.exports = {
    buildQuerystring,
    parseEntry,
    parseTitle,
    parseAccessionNumber,
    parseReporterTitle,
    parseNonDerivative,
    parseDerivative,
    extractPurchaseData,
    formatPurchaseData   
};