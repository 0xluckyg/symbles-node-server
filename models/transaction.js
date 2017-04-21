const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    ticker: String,
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
    securityTitle: {
        type: String,
        trim: true        
    },
    transactionCode: {
        type: String,
        trim: true
    },
    transactionPrice: {
        type: Number,        
        trim: true,
        minlength: 1
    },
    transactionAmount: {
        type: Number        
    },
    ownershipNature: {
        type: String,
        trim: true
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
        trim: true,
        minlength: 1
    }  
});

TransactionSchema.index({
    ticker: 1,
    reporter: 1
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = {Transaction};
