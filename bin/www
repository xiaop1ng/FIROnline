#!/usr/bin/env node
var ws = require('ws');
var app = require('../app');
var ws_server = require('../ws_server');

app.set('port', 3000);
var server = app.listen(3000);

ws_server.start(server);