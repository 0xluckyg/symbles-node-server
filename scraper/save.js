require('../config/config');
require('../db/mongoose');
const {Ticker} = require('../models/ticker');
const {Purchase} = require('../models/purchase');

function saveTicker(newTicker) {
    Ticker.update({
        ticker: newTicker.ticker
    },
    newTicker,
    {
        upsert: true
    });
}

function savePurchase(newPurchase) {
    const purchase = new Purchase(newPurchase);

    purchase.save();
}

module.exports = {
    saveTicker,
    savePurchase
};