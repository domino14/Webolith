/*global require, console, process*/
var https = require('https'),
  http = require('http'),
  sockjs = require('sockjs'),
  redis = require('redis'),
  fs = require('fs'),
  _ = require('underscore'),
  channels = require('./channels'),
  sockServer,
  server,
  redisClient;

var sslOptions = {
  key: fs.readFileSync('../../aerolith.key', 'utf8'),
  cert: fs.readFileSync('../../aerolith.org.chained.crt', 'utf8')
};

var redisPort = 6379,
  redisHost = 'localhost',
  REDIS_TOKEN_DB = 2;
sockServer = sockjs.createServer();

redisClient = redis.createClient(redisPort, redisHost);
sockServer.on('connection', function(conn) {
  conn.on('data', function(message) {
    // Let's see what's in this message.
    handleMessage(message, conn);
  });
  conn.on('close', function() {
    channels.manager.removeConnection(conn);
  });
});

if (process.env.NODE_ENV === 'production') {
  server = https.createServer(sslOptions);
} else {
  server = http.createServer();
}
sockServer.installHandlers(server, {prefix: '/socket'});
server.listen(9999, '0.0.0.0');

/**
 * Handles a message `message` from `connection`.
 * @param  {string} message    A JSON message string.
 * @param  {Object} connection A sockjs connection object.
 */
function handleMessage(message, connection) {
  var msgObj;
  try {
    msgObj = JSON.parse(message);
  } catch (e) {
    console.log(e);
    msgObj = {};
  }
  if (_.has(msgObj, 'token')) {
    handleTokenMessage(msgObj.token, connection);
  } else if (_.has(msgObj, 'chat')) {
    handleChatMessage(msgObj.chat, msgObj.channel, connection);
  }
}

/**
 * Handles a token message from the `connection`.
 * @param  {string} token      Connection token.
 * @param  {Object} connection Connection object.
 */
function handleTokenMessage(token, connection) {
  // This is a connection token. Verify that it exists in redis.
  redisClient.select(REDIS_TOKEN_DB, function(err) {
    if (err) {
      console.log(err);
      return;
    }
    redisClient.get(token, function(err, reply) {
      var response;
      if (err) {
        console.log(err);
        return;
      }
      if (_.isNull(reply)) {
        connection.write(JSON.stringify({'type': 'tokenError'}));
        return;
      }
      // The reply has the info we need.
      response = JSON.parse(reply);
      channels.manager.addToChannel(response.realm, connection,
        response.username);
    });
  });
}
/**
 * Handles a chat message from `connection`. Forwards to everyone in that
 * channel.
 * @param  {string} chat A chat message.
 * @param  {string} channel The name of the channel that the user chatted on.
 * @param  {Object} connection The user connection.
 */
function handleChatMessage(chat, channel, connection) {
  channels.manager.broadcastToChannel('chat', chat, channel, connection);
}
// Prevent node crashes.
process.on('uncaughtException', function(err) {
  console.error(err.stack);
});
