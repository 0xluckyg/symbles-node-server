const mongoose = require('mongoose');

const Purchase = mongoose.model('Purchase', {
    ticker: mongoose.Schema.Types.ObjectId,
    company: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
    },
    reporter: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
    },
    reporterTitle: {
        type: String,
        trim: true,
        minlength: 1
    },
    transaction: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
    },
    sharesTransacted: {
        type: Number,
        min: 1,
    },
    sharePrice: {
        type: Number,
        min: 0,
    },
    totalSharesOwned: {
        type: Number,
        min: 1,
    },
    date: Date,
    cik: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
    },
    accessionNumber: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
    },
    url: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
    }     
});

module.exports = {Purchase};
