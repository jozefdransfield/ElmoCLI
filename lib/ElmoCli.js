var _ = require("underscore")._;
var fs = require("fs");
var crypto = require("crypto");
var restler = require("restler");
var rest = require('../lib/JSONRestClient.js').rest;

var ElmoCli = exports = module.exports = function ElmoCli() {

    var config
    try {
        config = JSON.parse(fs.readFileSync("/Users/jozefdransfield/.elmo"));
    } catch (e) {
        console.log("Failed to find config file", e);
        process.exit(-1);
    }

    var command = process.argv[2];
    var certificate = fs.readFileSync(config.certificate);
    var privateKey = fs.readFileSync(config.privatekey);

    switch (command) {
        case "declare":
            var packageName = process.argv[3];
            if (!packageName) {
                console.log("No package defined")
                process.exit(-1);
            }
            rest.put(config.repository + "api/package/" + packageName)
                .body({type:"text/javascript", certificate: certificate})
                .request(function(err, data) {
                    console.log(data);
                });
            break;
        case "publish":
            var packageName = process.argv[3];
            if (!packageName) {
                console.log("No package defined!!")
                process.exit(-1);
            }
            var packageDefinition = JSON.parse(fs.readFileSync(process.cwd() + "/" + packageName + ".package.json"));

            sign(packageDefinition, privateKey, function(signature) {
                console.log("* Creating the definition");
                rest.put(config.repository + "api/package/" + packageName + "/" + packageDefinition.version)
                    .body(packageDefinition)
                    .header("signature", signature)
                    .request(function(err, data) {
                        console.log(data)
                    });
                //console.log(packageDefinition);
            });

            signFile(packageDefinition.main, privateKey, function(signature) {
                restler.post(config.repository + "filestore/" + packageDefinition.name + "/" + packageDefinition.version, {
                    multipart: true,
                    headers: {
                        "signature" : signature
                    },
                    data: {
                        'script[file]': restler.file(packageDefinition.main, 'text/javascript')
                    }
                }).on('complete', function(data) {
                        console.log(data);
                    });
            });
            break;
        default:
            console.log("Unknown command sad face")
    }
}

function sign(data, privateKey, callback) {
    var signer = crypto.createSign('sha1');

    signer.update(JSON.stringify(data));

    var signature = signer.sign(privateKey, 'base64');
    callback(signature);
}

function signFile(file, privateKey, callback) {
    var stream = fs.createReadStream(file);
    var signer = crypto.createSign('sha1');

    stream.resume();
    stream.on("data", function(data) {
        signer.update(data);
    });

    stream.on("end", function() {
        var signature = signer.sign(privateKey, 'base64');
        callback(signature);
    });
}

