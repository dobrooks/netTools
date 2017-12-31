require('dotenv').config();
var flint = require('./flintServer/flintConfig');
var webhook = require('node-flint/webhook');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var log = require('./svrConfig/logger');

var app = express();

//  New comments to see if git is working
<<<<<<< HEAD
//  Some more comments   2  hi from me  Some more comments hghhj  hjsdgfhjgsdhjaf   jhgdsfjhgsdahjfghj
=======
//  Some more comments   2  hi from me  SOME MORE
>>>>>>> 1720c00aec5504266a53d148420119112cccc520

app.use(bodyParser.json());
// define express path for incoming webhookssdfdfasd jsdfjahsdfkjhskdj
app.post('/flint',webhook(flint));
//REST API for bot monitor
app.get('/monitor', function (req, res) {
  var roomCount = flint.bots.length;
  var don = roomCount;
  var brooks = don;
  var json_response = {
    'name':process.env.SPARK_BOT_STRING,
    'roomCount': roomCount
  };
  res.status(200).json(json_response);
  res.end();
});
app.use(express.static(path.resolve(__dirname, 'bot')));
var server = app.listen(process.env.WEBPORT, function () {
  log.info('server : Chatbot listening on port %s', process.env.WEBPORT);
});

// gracefully shutdown (ctrl-c)
process.on('SIGINT', function() {
  log.info('server : stoppping...');
  server.close();
  flint.stop().then(function() {
    process.exit();
  });
});

module.exports = app;