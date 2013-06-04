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
      /*
       * Now tell everyone in the channel that this connection joined,
       * and tell this connection about everyone in the channel.
       */
      this.broadcastToChannel('joined', [username], name, conn, true);
      conn.write(JSON.stringify({
        'type': 'joined',
        'msg': this.peopleInChannel(name)
      }));
    },
    /**
     * Removes the connection conn from all channels that it is on. Also
     * tell everyone in each channel that this person left.
     * @param {Object} conn A sockjs connection object.
     */
    removeConnection: function(conn) {
      _.each(ChannelMap, _.bind(function(channel, channelName) {
        // Search for this connection in every channel.
        var toDelete = [];
        _.each(ChannelMap[channelName], function(connection, id) {
          if (id === conn.id) {
            toDelete.push(id);
          }
        });
        // Delete all marked objects (in toDelete).
        _.each(toDelete, _.bind(function(id) {
          delete ChannelMap[channelName][id];
          if (_.has(connectionHash, conn.id)) {
            this.broadcastToChannel(
              'left', connectionHash[(conn.id)], channelName, conn, true);
          }
        }, this));
      }, this));
      if (_.has(connectionHash, conn.id)) {
        delete connectionHash[(conn.id)];
      }
    },
    /**
     * Broadcasts a message of type `type` to `channel` from `conn`.
     * @param  {string} type    The type of the message.
     * @param  {string} message The message.
     * @param {string} channel The name of the channel.
     * @param  {Object} conn    The connection.
     * @param {boolean} skipConn Do not broadcast this message to `conn` if
     *                           `skipConn` is true.
     */
    broadcastToChannel: function(type, message, channel, conn, skipConn) {
      var username, toSend;
      if (!_.has(ChannelMap, channel)) {
        return;
      }
      if (!_.has(connectionHash, conn.id)) {
        return;
      }
      username = connectionHash[(conn.id)];
      toSend = JSON.stringify({'type': type, 'from': username, 'msg': message});
      console.log(toSend);
      // Find all sockets in this channel.
      _.each(ChannelMap[channel], function(connection) {
        if (!skipConn || connection !== conn) {
          connection.write(toSend);
        }
      });
    },
    /**
     * Gets a list of everyone in this channel.
     * @param  {string} channel The channel name.
     * @return {Array.<string>} A list of usernames in this channel.
     */
    peopleInChannel: function(channel) {
      var list = [];
      if (!_.has(ChannelMap, channel)) {
        return;
      }
      _.each(ChannelMap[channel], function(conn) {
        var username = connectionHash[(conn.id)];
        if (username) {
          list.push(username);
        }
      });
      return list;
    }
  };
  // Exports
  exports.manager = ChannelManager;
}());