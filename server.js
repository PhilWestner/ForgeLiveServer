/////////////////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Jaime Rosales 2016 - Forge Developer Partner Services
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////////////////

/////////////////////////////
// Modified for AEC Hackatron 2017 Munic by 44Forge
/////////////////////////////


var fs = require('fs');
if (!fs.existsSync("./www/extensions/FileSaver.min.js")) {
  console.log("FileSaver script for client not found ... call 'node init.js' after 'npm install'");
  process.exit();
}
if (!fs.existsSync("./www/extensions/jquery.simple.websocket.min.js")) {
  console.log("jquery.simple.websocket script for client not found ... call 'node init.js' after 'npm install'");
  process.exit();
}
if (!fs.existsSync("./www/js/fileurn.js")) {
  console.log("generate model data forge sorage by calling 'node uploadModel.js' ... dont forget to set client_id and client_secret!!");
  process.exit();
}


var favicon = require('serve-favicon');
var oauth = require('./routes/oauth');
var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);

var bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.set('port', process.env.PORT || 3000);
app.use('/', express.static(__dirname + '/www'));
app.use(favicon(__dirname + '/www/images/favicon.ico'));
app.use(bodyParser.json());

var router = express.Router();

//var lastMessages = { unknown: { empty: true }, unknown1: { empty: true }, unknown2: { empty: true } };
var lastMessages = { };

router.ws('/geometryupdate', function (ws, req) {
  ws.on('message', function (msg) {
    //console.log("geometryupdate message on server" + msg);
    //ws.send(msg);

    Object.keys(lastMessages).forEach(function(key,index) {
        //console.log("will send " + key);
        ws.send(JSON.stringify(lastMessages[key]));
    });

  });
});

app.use("/ws", router);

var aWss = expressWs.getWss('/');

// /////////////////////////////////////////////////////////////////////////////////
// //
// // Use this route for proxying access token requests
// //
// /////////////////////////////////////////////////////////////////////////////////

app.use('/oauth', oauth);
var server = app.listen(app.get('port'), function () {
  console.log('Server listening on port ' + server.address().port);
});

app.post('/geometryupdate', function (req, res) {

	var clntid = req.body['device_id'];
	lastMessages[clntid] = req.body;
	
  aWss.clients.forEach(function (client) {
    Object.keys(lastMessages).forEach(function(key,index) {
        //console.log("will send " + key);
        ws.send(JSON.stringify(lastMessages[key]));
    });	
  });
	
/*
  aWss.clients.forEach(function (client) {
    //client.send(msg.data);
    //console.log("a client: " + JSON.stringify(req) );

    //console.log("sending ");

    //var pln = { polylines: [ [0,1,2,3,4,5],[0,1,2,3,4,5] ]  };

    //console.log("sending " + JSON.stringify(req.body) );

    var clntid = req.body['device_id'];

    //console.log("add client message: " + clntid);

    lastMessages[clntid] = req.body;

    client.send(JSON.stringify(req.body));
  });
*/

  res.send('OK');
});

app.get('/geometry', function (req, res) {
   res.setHeader('Content-disposition', 'attachment; filename=scandata.json');
   res.setHeader('Content-type', 'application/json');
   res.charset = 'UTF-8';
   
   res.write(JSON.stringify(lastMessages));
   
   res.end();
});

app.post('/geometry', function (req, res) {

  //console.log("got file request: " + JSON.stringify(req.body));

  lastMessages = req.body;

  aWss.clients.forEach(function (client) {
    Object.keys(lastMessages).forEach(function(key,index) {
        //console.log("will send to " + key);
        client.send(JSON.stringify(lastMessages[key]));
    });	
  });  
  
  res.send('OK');
});

