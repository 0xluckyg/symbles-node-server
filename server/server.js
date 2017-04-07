require('../config/config');
const express = require('express');
const bodyParser = require('body-parser');

const _ = require('lodash');
const {ObjectID} = require('mongodb');
const mongoose = require('../db/mongoose');
const {Purchase} = require('../models/purchase');
const {User} = require('../models/user');
const {Ticker} = require('../models/ticker');


const port = process.env.PORT;

const app = express();

app.use(bodyParser.json());

app.listen(port, () => {
    console.log('Started on port: ', port);
});

module.exports = {
    app: app
};
