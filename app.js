var express = require('express')
var app = express()
app.use(express.static('public'))

app.get('/', function (req, res) {
    res.send('index.html')
})


console.log('listening at http://%s:%s', '0.0.0.0', 3000);

module.exports = app