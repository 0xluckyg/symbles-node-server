require('../config/config');
require('../db/mongoose');
const express = require('express');
const bodyParser = require('body-parser');

const _ = require('lodash');
const {Transaction} = require('../models/transaction');
const {User} = require('../models/user');
const {Ticker} = require('../models/ticker');
const {scrape} = require('../scraper/form4/scrape');

// scrape();

const port = process.env.PORT;

const app = express();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.CLIENT_URL);
    res.header("Access-Control-Allow-Methods", "PUT, GET, FETCH, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Expose-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

app.use(bodyParser.json());

app.post('/user/login', (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);

    User.findByCredentials(body.email, body.password).then((user) => {
        return user.generateAuthToken().then((token) => {
            res.send({ token, user });
        });
    }).catch((err) => {
        res.status(400).send(err);
    });
});

app.post('/user/signup', (req, res) => {
    const user = new User(req.body);

    user.save().then(() => {
        return user.generateAuthToken();
    }).then(token => {
        res.send({ token, user });
    }).catch((err) => {
        res.status(400).send(err);
    });
});

app.get('/user/me', (req, res) => {
    const queryToken = req.query.token;
    
    User.findByToken(queryToken)
    .then(user => {
        user.removeToken(queryToken);
        return user.generateAuthToken().then((token) => {
            res.send({ token, user });
        });
    });
});

app.get('/form4', (req, res) => {
    Ticker.find().limit(30)
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
