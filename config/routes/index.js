var express = require('express');

module.exports = function (app) {
//Redirect Home to API Documentation
  app.get('/', function (req, res, next) {
    res.status(301).redirect('https://google.com.ar');
  });
}
