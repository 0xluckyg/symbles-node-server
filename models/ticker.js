//This model represents the tickers that user will see on main page

const mongoose = require('mongoose');

const TickerSchema = new mongoose.Schema({
    ticker: {
         type: String,
         trim: true,
         required: true
    },
    updated: Date,
    company: {
        type: String,
        trim: true,
        required: true
    }
});

TickerSchema.index({
    ticker: 1,
    updated: 1
});

const Ticker = mongoose.model('Ticker', TickerSchema);

module.exports = {Ticker};
