var http = require('http'),
  sockjs = require('sockjs');

var echo = sockjs.createServer();
echo.on('connection', function(conn) {
  console.log('new connection ' + conn);

  conn.on('data', function(message) {
    console.log('got message from ' + conn, message);
    conn.write(message);
  });
  conn.on('close', function() {
    console.log('connection', conn, 'closed');
  });
});

var server = http.createServer();
echo.installHandlers(server, {prefix: '/echo'});
server.listen(9999, '0.0.0.0');
