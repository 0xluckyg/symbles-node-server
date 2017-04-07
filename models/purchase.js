const mongoose = require('mongoose');

const Purchase = mongoose.model('Purchase', {
    tickerId: mongoose.Schema.Types.ObjectId,
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
    date: Date,
    
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
    }
});

module.exports = {Purchase};
