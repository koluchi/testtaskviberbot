﻿var host = (function () {
    var self = this;
    var express = require('express');
    var path = require('path');
    var favicon = require('serve-favicon');
    var logger = require('morgan');
    var bodyParser = require('body-parser');
    mongoose = require('mongoose');
    mongoose.Promise = global.Promise;
    mongoose.connect('mongodb://localhost/testtaskviberbot');
    require('./Web/models/models.js');
        
    var app = express();
    var web = require('./Web/app.js');
    
    var server = require('http').createServer(app);
    var io = require('socket.io')(server);

    app.set('env', 'development');

    let config = require('./config/config.js');
    config.appAPI = app;
    app.set('config', config);

    io.sockets.on('connection', function (socket) {
        config.ioSocket = socket;
        app.set('config', config);
    });

    app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
    app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
    app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
    app.use('/fonts', express.static(__dirname + '/node_modules/bootstrap/dist/fonts')); // redirect CSS bootstrap
    app.use('/js', express.static(__dirname + '/node_modules/Knockout/build/output')); // redirect Knockout
    app.use('/js', express.static(__dirname + '/node_modules/knockout-mapping/dist')); // redirect Knockout-mapping plugin
    app.use('/js', express.static(__dirname + '/node_modules/socket.io-client/dist')); // redirect Socket.IO-Client
    
    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');
    
    // uncomment after placing your favicon in /public
    //app.use(favicon(__dirname + '/public/favicon.ico'));
    app.use(logger('dev'));
    app.use(bodyParser.urlencoded({ extended: false }));
    
    
    app.get('/', function (req, res) {
        res.redirect('/web');
    });
    app.use('/web', web);
    
    var loadBots = function(){
        var botAPI = require('./code/viberbot/index.js')(app);
        botAPI.loadBots();
    };

    io.sockets.on("connection", function(socket){
        socket.on("registerChat",function(data){
            let _self = this;
            let conf = app.get('config');
            conf.sockets.push({socket:_self, botId: data.botId, userId: data.userId});
            app.set('config', conf);
            _self.emit('registered');
        });
        socket.on("disconnect", function(){
            let _self = this;
            let id = _self.id;
            console.log('socket id:'+ id + ' disconnected');
            let conf = app.get('config');
            let index = conf.sockets.findIndex(function(el){return el.socket.id == id;});
            conf.sockets.splice(index, 1);
            app.set('config', conf);
        });
    });

    var listen = function(){
        app.set('port', 8080);//process.env.PORT ||3000);

        server.listen(app.get('port'), function() {
            loadBots();
        });
    }

    listen();

    
    return app;
})();
module.exports = host;