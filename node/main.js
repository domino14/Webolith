var sys         = require('sys'),
        express = require('express'),
        io          = require('socket.io'), 
        crypto  = require('crypto'),
        url = require('url');
        
var fs = require('fs');

try {
    var data = fs.readFileSync('../djAerolith/settings.py', 'ascii');
}
catch (err) {
    console.error('There was an error opening the file:');
    console.log(err);
}


const redis = require('redis');

const secret_key = data.match(/SECRET_KEY\s*=\s*["'](\S*)['"]/)[1]; // this is so ghetto.
const redis_port = data.match(/REDIS_PORT\s*=\s*(\S*)/)[1];
const redis_host = data.match(/REDIS_HOST\s*=\s*["'](\S*)['"]/)[1];
var hash = crypto.createHash('sha1');
hash.update(secret_key);
const unsign_key = hash.digest();

function unsign_value(signature, value)
{
    var hmac = crypto.createHmac('sha1', unsign_key);
    hmac.update(value);
    return signature === hmac.digest('hex');
}

clientData = {}

//////////////////// 

var app = express.createServer();
app.listen(1988);
//io.set('log level', 1);
var socket = io.listen(app); 

socket.configure('production', function () {
    console.log('production settings')
    socket.enable('browser client minification');
    socket.enable('browser client etag');
    socket.enable('browser client gzip');
    socket.set('log level', 1);
})

socket.configure('development', function(){
    console.log('development settings')
});

socket.sockets.on('connection', function (client){ 
  // new client is here!
    console.log('sockets connection');
    const subscribe = redis.createClient(redis_port, redis_host);
    client.on('connect', function(msg) {
        var query = url.parse(msg, parseQueryString=true).query;    // '?' is ghetto
        // verify signature
        var user = query.user;
        var time = query.time;
        var signature = query.signature;
        clientData[client.id] = {user: query.user};
        // check that the signature is not too old, and that it matches this user
        var str = '/node?';
        str += 'time=' + time + '&user=' + user;
        console.log('unsigning', str)
        if (unsign_value(signature, str) && Date.now() / 1000 < Number(time))
        {
            console.log('pass!');
           // subscribe.unsubscribe(user);    // unsubscribe from the user stream first -- this seems to fail if not subscribed, check for error.
            subscribe.subscribe(clientData[client.id].user);
        }
        else
        {
            console.log('fail');
            subscribe.quit();
        }
    })

    //client.on('')

    client.on('disconnect', function() {
        subscribe.quit();
        console.log('client disconnected', client.id)
        delete clientData[client.id];
    });

    client.on('error', function () {
        console.log('client error!');
    });
    
    subscribe.on("message", function(channel, message) {
        console.log('got message for user', clientData[client.id].user);
        client.send(message);
    });
    subscribe.on('error', function(error) {
       console.log('There was a Redis connection error') 
       console.log(error)
    });
});

