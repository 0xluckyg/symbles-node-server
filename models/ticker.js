//This model represents the tickers that user will see on main page

const mongoose = require('mongoose');

//Creating a new todo example
const Ticker = mongoose.model('Ticker', {
    updated: Date,
    company: {
        type: String,
        required: true
    }
});

module.exports = {Ticker};
