var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

// load up the user model
const users = require("../app/models/index").Users;
var config = require('../config/config'); // get db config file

module.exports = function(passport) {
  var opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
  opts.secretOrKey = config.secret;
  passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    users.findOne({
      where: {id: jwt_payload.id},
      attributes: ['id']
    }).then(thisUser => {
      if (thisUser) {
        done(null, thisUser);
      } else {
        done(null, false);
      }
      return false;
    }).catch(error => {
        return done(error, false);
    });
  }));
};
