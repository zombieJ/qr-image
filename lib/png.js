"use strict";

var crc32 = require('./crc32');

var PNG_HEAD = Buffer([137,80,78,71,13,10,26,10]);
var PNG_IHDR = Buffer([0,0,0,13,73,72,68,82,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0]);
var PNG_IEND = Buffer([0,0,0,0,73,69,78,68,174,66,96,130]);

function png(bitmap, stream) {
    var zlib = require('zlib');
    var IHDR = Buffer(25);
    PNG_IHDR.copy(IHDR);
    IHDR.writeUInt32BE(bitmap.size, 8);
    IHDR.writeUInt32BE(bitmap.size, 12);
    IHDR.writeUInt32BE(crc32(IHDR.slice(4, -4)), 21);

    stream.push(PNG_HEAD);
    stream.push(IHDR);

    var IDAT = [ Buffer([0,0,0,0,73,68,65,84]) ];

    zlib.createDeflate({ level: 9 }).on('data', function(chunk) {
        IDAT.push(chunk);
    }).on('end', function() {

        IDAT.push(Buffer(4));
        IDAT = Buffer.concat(IDAT);
        IDAT.writeUInt32BE(IDAT.length - 12, 0);
        IDAT.writeUInt32BE(crc32(IDAT.slice(4, -4)), IDAT.length - 4);
        stream.push(IDAT);

        stream.push(PNG_IEND);
        stream.push(null);
    }).end(bitmap.data);
}

function png_sync(bitmap) {
    var pako = require('pako');
    var stream = [];
    var IHDR = Buffer(25);
    PNG_IHDR.copy(IHDR);
    IHDR.writeUInt32BE(bitmap.size, 8);
    IHDR.writeUInt32BE(bitmap.size, 12);
    IHDR.writeUInt32BE(crc32(IHDR.slice(4, -4)), 21);

    stream.push(PNG_HEAD);
    stream.push(IHDR);

    var IDAT = Buffer.concat([
        Buffer([0,0,0,0,73,68,65,84]),
        Buffer(pako.deflate(bitmap.data, { level: 9 })),
        Buffer(4)
    ]);

    IDAT.writeUInt32BE(IDAT.length - 12, 0);
    IDAT.writeUInt32BE(crc32(IDAT.slice(4, -4)), IDAT.length - 4);
    stream.push(IDAT);
    stream.push(PNG_IEND);

    return Buffer.concat(stream);
}

function bitmap(matrix, size, margin) {
    var pointsCount = matrix.length;
    var imageSize = (pointsCount + 2 * margin) * size;
    var data = Buffer((imageSize + 1) * imageSize);
    data.fill(0xDDDDDD);
    for (var j = 0; j < imageSize; j++) {
        data[j * (imageSize + 1)] = 0;
    }

    var des = Math.floor(size / 2.5);
    //console.log("Size:", size, "/ Des:", des);
    var color;
    var COLOR_HIT = 0;
    var COLOR_MISS = 255;

    for (var y = 0; y < pointsCount; y++) {
        for (var x = 0; x < pointsCount; x++) {
            color = matrix[y][x] ? COLOR_HIT : COLOR_MISS;
            var offset = ((margin + y) * (imageSize + 1) + (margin + x)) * size + 1 + des * (imageSize + 1);
            data.fill(color, offset + des, offset + size - des);
            for (var offsetY = 1; offsetY < size - des * 2; offsetY++) {
                data.copy(data, offset + des + offsetY * (imageSize + 1), offset + des, offset + size - des);
            }
        }
    }

    return {
        data: data,
        size: imageSize
    }
}

module.exports = {
    bitmap: bitmap,
    png: png,
    png_sync: png_sync
}
