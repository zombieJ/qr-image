var http = require('http');
var url = require('url');
var qr = require('../');

http.createServer(function (req, res) {
    var query = url.parse(req.url, true).query;
    var text = query.text;
    try {
        if(query.size) query.size = Number(query.size);
        if(query.margin) query.margin = Number(query.margin);

        var img = qr.image(text, query);
        res.writeHead(200, {'Content-Type': 'image/png'});
        img.pipe(res);
    } catch (e) {
        res.writeHead(414, {'Content-Type': 'text/html'});
        res.end('<h1>414 Request-URI Too Large</h1>');
    }
}).listen(5152);

console.log("Listen: 5152...[text, size, ec_level, parse_url]");