/* global require, exports, console */
var _ = require('underscore');

(function() {
  // The channel/realm manager.

  var ChannelMap, ChannelManager, connectionHash;
  ChannelMap = {};
  connectionHash = {};
  ChannelManager = {
    /**
     * Adds the connection conn to a channel.
     * @param  {string} name The channel name.
     * @param  {Object} conn A sockjs connection object.
     * @param  {string} username The user's username.
     */
    addToChannel: function(name, conn, username) {
      var key;
      if (_.has(ChannelMap, name)) {
        ChannelMap[name][conn.id] = conn;
      } else {
        key = conn.id;
        ChannelMap[name] = {key: conn};
      }
      // Associate the username with the connection.
      connectionHash[conn.id] = username;
      console.log('Added', conn.id, username, 'to channel', name);
      console.log('connections:', connectionHash);
    },
    /**
     * Removes the connection conn from all channels that it is on.
     * @param {Object} conn A sockjs connection object.
     */
    removeConnection: function(conn) {
      _.each(ChannelMap, function(channel, channelName) {
        // Search for this connection in every channel.
        var toDelete = [];
        _.each(ChannelMap[channelName], function(connection, id) {
          if (id === conn.id) {
            console.log("Found this connection in", channelName, "...deleting");
            toDelete.push(id);
          }
        });
        // Delete all marked objects (in toDelete).
        _.each(toDelete, function(id) {
          delete ChannelMap[channelName][id];
        });
      });
      if (_.has(connectionHash, conn.id)) {
        delete connectionHash[(conn.id)];
      }
      console.log('connections:', connectionHash);
    },
    /**
     * Broadcasts a message of type `type` to `channel` from `conn`.
     * @param  {string} type    The type of the message.
     * @param  {string} message The message.
     * @param {string} channel The name of the channel.
     * @param  {Object} conn    The connection.
     */
    broadcastToChannel: function(type, message, channel, conn) {
      var username, toSend;
      if (!_.has(ChannelMap, channel)) {
        console.log('User tried to broadcast to nonexistent channel.');
        return;
      }
      if (!_.has(connectionHash, conn.id)) {
        console.log('User not in connection hash.', connectionHash);
        return;
      }
      username = connectionHash[(conn.id)];
      toSend = JSON.stringify({'type': type, 'from': username, 'msg': message});
      // Find all sockets in this channel.
      _.each(ChannelMap[channel], function(connection) {
        connection.write(toSend);
      });
    }
  };
  // Exports
  exports.manager = ChannelManager;
}());