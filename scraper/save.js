require('../config/config');
require('../db/mongoose');
const {Ticker} = require('../models/ticker');
const {Transaction} = require('../models/transaction');

function updateTicker4(newTicker) {
    console.log(newTicker);
    Ticker.findOneAndUpdate({
        ticker: newTicker.ticker
    },
    newTicker,
    {
        upsert: true
    }).then(t => {
        console.log(t);
    });
}

function saveTransaction(newTransaction) {
    const transaction = new Transaction(newTransaction);

    transaction.save();
}

module.exports = {
    updateTicker4,
    saveTransaction
};