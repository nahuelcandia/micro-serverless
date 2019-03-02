//process.env.NODE_ENV = "production";
// From .env
module.exports = require('./env/' + process.env.NODE_ENV + '.js');
