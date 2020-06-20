var events = require('events');
events.defaultMaxListeners = 100;
import _ from 'underscore';
import npmRequest from 'request';

function makeErrorByStatus(statusCode, content) {
    const MAX_LENGTH = 500; // if you change this, also change the appropriate test

    var truncate = function(str, length) {
        return str.length > length ? str.slice(0, length) + '...' : str;
    };

    var contentToCheck = typeof content == "string" ? content : content.toString();

    var message = "failed [" + statusCode + "]";

    if (contentToCheck) {
        message += " " + truncate(contentToCheck.replace(/\n/g, " "), MAX_LENGTH);
    }

    return new Error(message);
}

function populateData(response) {
    let contentType = (response.headers['content-type'] || ';').split(';')[0];
    if (_.include(['application/json', 'text/javascript',
            'application/javascript', 'application/x-javascript','application/x-json'], contentType)
        &&response.content&&typeof response.content === 'string'
    ) {
        try {
            response.data = JSON.parse(response.content);
        } catch (err) {
            response.data = null;
        }
    } else {
        response.data = null;
    }
}

function _call(method, url, options, callback) {
    if (! callback && typeof options === "function") {
        callback = options;
        options = null;
    }
    options = options || {};
    method = (method || "").toUpperCase();
    if (! /^https?:\/\//.test(url))
        throw new Error("url must be absolute and start with http:// or https://");

    var headers = {};
    var content = options.content;
    if (options.data) {
        content = JSON.stringify(options.data);
        headers['Content-Type'] = 'application/json';
    }


    var paramsForBody;
    if (content || method === "GET" || method === "HEAD"){

    }else
        paramsForBody = options.params;

    if (options.auth) {
        if (options.auth.indexOf(':') < 0)
            throw new Error('auth option should be of the form "username:password"');
        headers['Authorization'] = "Basic "+
            (new Buffer(options.auth, "ascii")).toString("base64");
    }

    if (paramsForBody) {
        headers['Content-Type'] = "application/x-www-form-urlencoded";
    }

    _.extend(headers, options.headers || {});

    // wrap callback to add a 'response' property on an error, in case
    // we have both (http 4xx/5xx error, which has a response payload)
    callback = (function(callback) {
        return function(error, response) {
            if (error && response)
                error.response = response;
            callback(error, response);
        };
    })(callback);

    // safety belt: only call the callback once.


    callback = _.once(callback);

    var reqOptions = _.extend({
        url: url,
        method: method,
        encoding: options.encoding || "utf8",
        jar: false,
        timeout: options.timeout,
        body: content,
        followRedirect: options.followRedirects,
        headers: headers
    }, options.npmRequestOptions || {});
    var responseCallback = function responseCallback(error, res, body) {
        var response = null;

        if (! error) {
            if(body&&body.length>1000000){
                //console.log(newUrl,'totalLength: ',body.length);
            }
            response = {};
            response.statusCode = res.statusCode;
            response.content = body;
            response.headers = res.headers;

            populateData(response);

            if (response.statusCode >= 400)
                error = makeErrorByStatus(response.statusCode, response.content);
        }

        callback(error, response);
    };

    var h = null;
    //try {
        if (method.toLowerCase() == 'post') {
            h = npmRequest.post(reqOptions, responseCallback);
        } else if (method.toLowerCase() == 'put') {
            h = npmRequest.put(reqOptions, responseCallback);
        } else {
            h = npmRequest.get(reqOptions, responseCallback);
        }
    //}catch(error){
    //    return callback(error, null);
    //}
    var totalLength =0;
    h.on('data', function(data) {
        totalLength+=data.length;
        if (totalLength > 1000*1000)
            h.destroy();
    });
    h.on('error', function(error) {
        callback(error, null);
    });
}

function httpCall(method, url, options, callback){
    return _call(method, url, options,function(err,result){
        callback(err,result);
    });
}

export {
    httpCall
}