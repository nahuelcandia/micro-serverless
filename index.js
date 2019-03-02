var express = require('express');
var environment = require('./config/config.js')
var packagejson = require('./package.json');

var app = express();


var path = require('path');
var passport = require('passport');
var logger = require('morgan');
var cookieParser = require('cookie-parser');

var morgan = require('morgan');

var port = environment.port;

var path = require('path');

var bodyParser = require('body-parser');
var dateFormat = require('dateformat');
var now = new Date();

var cors = require('cors');
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));
app.use(passport.initialize());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"); res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  next();
});

// read cookies (needed for auth)
//app.use(bodyParser()); // get information from html forms
app.set('view engine', 'ejs');

const models = require("./app/models");
// routes ======================================================================
require('./config/routes')(app);


//launch ======================================================================
app.listen(port);

if(process.env.NODE_ENV == 'development') {
  module.exports = app;
  exports = module.exports = app;
} else {
  exports[packagejson.name] =  app;
}

console.log('Service started on port ' + port);
