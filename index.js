'use strict';

var duplexer = require('duplexer2');
var through  = require('through2');

var composeStream = function (fn) {
    var output = through.obj();
    var ended  = false;
    var end, input, stream;

    end = function () {
        if (stream && !ended) {
            ended = true;
        }
        else {
            output.end();
        }
    };

    input = through.obj(
        function (chunk, encoding, callback) {
            stream = fn.call(this, chunk, encoding);
            if (stream) {
                stream.on('error', function (error) {
                    output.emit('error', error);
                });
                stream.on('end', end);
                stream.pipe(output, { end: false });
                stream.write(chunk);
            }
            else {
                this.push(chunk);
            }
            callback();
        },
        function (callback) {
            if (stream) {
                stream.end();
            }
            end();
            callback();
        }
    );

    input.pipe(output, { end: false });

    return duplexer(input, output);
};

module.exports = composeStream;
