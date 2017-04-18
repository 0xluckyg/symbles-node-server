require('../config/config');
require('../db/mongoose');
const {Ticker} = require('../models/ticker');
const {Purchase} = require('../models/purchase');

function saveTicker(newTicker) {
    const ticker = new Ticker(newTicker);

    ticker.save();
}

function savePurchase(newPurchase) {
    const purchase = new Purchase(newPurchase);

    purchase.save();
}

module.exports = {
    saveTicker,
    savePurchase
};