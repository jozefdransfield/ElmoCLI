var url = require("url");
var http = require("http");
var _ = require("underscore")._;

function RestClientRequestBuilder() {
    var host;
    var path;
    var port;
    var method;
    var accept;
    var headers = {};
    var agent = "Go for a lay down"

    this.target = function(target) {
        var parsedUrl = url.parse(target);
        host = parsedUrl.hostname;
        path = parsedUrl.pathname;
        port = parsedUrl.port;
        return this;
    }

    this.header = function(name, value) {
        headers[name] = value;
        return this;
    }

    this.method = function(requestMethod) {
        method = requestMethod;
        return this;
    }

    this.accepts = function(requestAccepts) {
        accept = requestAccepts;
        return this;
    }

    this.body = function(requestBody) {
        body = requestBody;
        return this;
    }
    this.request = function(callback) {
        var req = http.request({
            host: host,
            path: path,
            port: port,
            method: method
        }, function (res) {
            res.setEncoding('utf8');
            var data = "";
            res.on('data', function (chunk) {
                data += chunk.toString();
            });
            res.on("end", function() {
                callback(null, JSON.parse(data));
            })
        });

        req.on('error', function(e) {
            callback(e, null);
        });

        req.setHeader("Content-Type", "application/json");
        req.setHeader("Accept", "application/json")

        _(headers).each(function(value, key) {
            req.setHeader(key, value);
        });
        req.write(JSON.stringify(body));
        req.end();

    }
}

module.exports.rest = {
    get: function(target) {
        var builder = new RestClientRequestBuilder();
        builder.target(target);
        builder.method("GET");
        return builder;
    },
    put: function(target) {
        var builder = new RestClientRequestBuilder();
        builder.target(target);
        builder.method("PUT");
        return builder;
    },
    post: function(target) {
        var builder = new RestClientRequestBuilder();
        builder.target(target);
        builder.method("POST");
        return builder;
    },
    delete: function(target) {
        var builder = new RestClientRequestBuilder();
        builder.target(target);
        builder.method("DELETE");
        return builder;
    }
}
