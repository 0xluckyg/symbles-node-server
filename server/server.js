require('../config/config');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const _ = require('lodash');
const {ObjectID} = require('mongodb');
const mongoose = require('../db/mongoose');
const {Transaction} = require('../models/transaction');
const {User} = require('../models/user');
const {Ticker} = require('../models/ticker');
const {scrape} = require('../scraper/form4/scrape');

// scrape();

const port = process.env.PORT;

const app = express();

// app.use(cors({origin:true,credentials: true}));
// app.options('*', cors());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.CLIENT_URL);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Auth");
    res.header("Access-Control-Expose-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Auth");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

app.use(bodyParser.json());

app.post('/login', (req, res) => {

});

app.post('/signup', (req, res) => {
    const user = new User(req.body);

    user.save().then(() => {
        return user.generateAuthToken();
    }).then((token) => {
        console.log('User', user);
        res.header('X-Auth', token).send(user);
    }).catch((err) => {
        res.status(400).send(err);
    });
});

app.get('/form4', (req, res) => {
    Ticker.find()
    .sort({updated4:-1})
    .then(tickers => {
        findTransactions(tickers);
    });  

    function findTransactions(tickers) {
        const transactions = [];
        tickers.forEach(ticker => {
            Transaction.find({
                ticker: {$in: ticker.ticker}
            }).sort({date:-1})
            .then(filings => {                
                transactions.push(filings);
                if (transactions.length === tickers.length) {
                    sendData(transactions);
                }
		    });                        
        });
    }

    function sendData(data) {
        res.send(data);
    }
});

app.listen(port, () => {
    console.log('Started on port: ', port);
});

module.exports = {
    app: app
};
