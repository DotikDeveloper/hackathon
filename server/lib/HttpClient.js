import {EventEmitter} from 'events';
import {isset} from "./utils";
import _ from 'underscore';
import {httpCall} from "./httpcall";
/**
 * @category server
 * @subcategory lib
 * */
export default class HttpClient extends EventEmitter{
    constructor(url){
        super();
        this.baseUrl = url;
        this._url = '';
        this.getParams = {};
        this.timeout = HttpClient.DEFALT_TIMEOUT;
        this.headers = {};
        this.cookies = {};
        this.proxy = null;
        this.httpMethod = null;
        this.postData = {};
        this.files = [];
        this.useCookies = false;
        this.npmRequestOptions = {};
        this.formContentType = HttpClient.FORM_MULTIPART;
        this.followLocation = false;
        this.redirectsCount = 0;
        this.gzip = false;
        this.encoding = 'utf8';
        this.keepAlive = false;

        this.on('error',(err,content)=>{
            HttpClient.listener.emit('error',err,content,this);
        });
        this.on('success',(content)=>{
            HttpClient.listener.emit('success',content,this);
        });
        this.setMaxListeners(50);
    }

    /**
     * Инициализирует HttpClient для указанных options
     * @param {object} options
     * @param {string} options.url
     * @param {object|string[]} options.headers
     * @param {object} options.proxy
     * @param {string} options.proxy.ip
     * @param {number} options.proxy.port
     * @param {string} options.proxy.login
     * @param {string} options.proxy.pass
     * @param {string} options.proxy.protocol
     * @param {string} options.httpMethod HTTP метод, GET по умолчанию
     *
     * @returns {HttpClient}
     * */
    static forOptions(options){
        let clientClass = options.clientClass || HttpClient;
        let client = new clientClass(options.url);
        if(options.headers) {
            client.withHeaders(options.headers);
        }
        if(options.cookies){
            client.useCookies = true;
            client.withCookies(options.cookies);
        }
        if(options.proxy)
            client.withProxy(options.proxy);
        if(options.httpMethod)
            client.withHttpMethod(options.httpMethod);
        if(options.postData){
            client.withPostData(options.postData);
        }
        if(options.files)
            client.files = options.files;
        if(options.formContentType)
            client.formContentType = options.formContentType;
        if(options.followLocation)
            client.followLocation = options.followLocation;
        if(isset(options.timeout))
            client.timeout = options.timeout;
        if(isset(options.gzip))
            client.gzip = options.gzip;
        if(options.keepAlive)
            client.keepAlive = true;
        if(options.encoding)
            client.encoding = options.encoding;
        if(options.referer){
            if(typeof(options.referer)=='string')
                client.withHeader('Referer',options.referer,false);
            else if(isset(options.referer.execute))
                client.withHeader('Referer',options.referer.getUrl(),false);
        }
        if(options.context)
            options.context.onClient(client,options.contextOptions || {});

        if(options.getParams){
            _.each(options.getParams,function(value,key){
                client.withGetParam(key,value);
            });
        }
        return client;
    }

    filteredExecute(filter){
        let url = this.getUrl();
        let client = this;
        return new Promise(function (resolve,reject) {
            client.on('error',function(err){
                //console.log('err:',err);
                setTimeout(function(){
                    client.baseUrl = url;
                    client.execute();
                },0);
            });
            client.on('success',function(content){
                if(filter(content,client)){
                    return resolve(content);
                }else{
                    setTimeout(function(){
                        client.emit('error');
                    },0);
                }
            });
            client.execute();
        });
    }

    withPostData(data){
        for(var key in data){
            this.postData[key] = data[key];
        }
        return this;
    }

    /*
     contentType: 'text/csv',
     name: 'spreadsheet1.csv',
     path:path
     file: path // fake function to generate csv data
     */
    withFile(fileData){
        this.files.push(fileData);
        return this;
    }

    withProxy(proxy){
        this.proxy = proxy;
        return this;
    }

    withNpmRequestOptions(options){
        for(let key in options){
            this.npmRequestOptions[key] = options[key];
        }
        return this;
    }

    withHttpMethod(method){
        this.httpMethod = method;
        return this;
    }

    withGetParam(key,val){
        this.getParams[key] = val;
        return this;
    }

    withHeader(hKey,hVal,safe){
        if(!safe||!this.hasHeader(hKey))
            this.headers[hKey] = hVal;
        return this;
    }

    withHeaders(headers,safe){
        if(Array.isArray(headers)){
            var re = /([^:]+):(.+)/;
            _.each(headers,function(s){
                var match =re.exec(s);
                if(match)
                    this.withHeader( match[1].trim() , match[2].trim(),safe );
            },this);
        }else{
            for (var hKey in headers)
                this.withHeader(hKey, headers[hKey],safe);
        }
        return this;
    }

    hasHeader(hKey){
        var result = false;
        for(var key in this.headers){
            if(key.toLowerCase()==hKey.toLowerCase())
                result = this.headers[key];
        }
        return result;
    }

    withCookies(cookies){
        var _client = this;
        if(Array.isArray(cookies)){
            _.each(cookies,function(cookie){
                _client.withCookie(cookie);
            });
        }else{
            for(var key in cookies)
                this.withCookie(cookies[key]);
        }
        return this;
    }

    withCookie(cookie){
        var key = cookie.key || cookie.name;
        this.cookies[key] = cookie;
        return this;
    }

    getUrl(){
        if(!this._url){
            if(_.size(this.getParams)>0) {
                var urlData = HttpClient.urlParser.parse(this.baseUrl, true, true);
                urlData.search = '';
                for (var get_param in this.getParams) {
                    urlData.query[get_param] = this.getParams[get_param];
                }
                this._url = HttpClient.urlParser.format(urlData);
            }else
                this._url = this.baseUrl;
        }
        return this._url;
    }

    getHttpMethod(){
        if(this.httpMethod)
            return this.httpMethod;
        if( !_.isEmpty( this.postData )||this.files.length>0)
            return HttpClient.METHOD_POST;
        else
            return HttpClient.METHOD_GET;
    }

    doIncomingCookies(content){
        if (content && content.headers) {
            var headers = content.headers;
            var cookies;
            if (headers['set-cookie']) {
                if (headers['set-cookie'] instanceof Array)
                    cookies = headers['set-cookie'].map(function (c) {
                        return (HttpClient.Cookie.parse(c));
                    });
                else
                    cookies = [HttpClient.Cookie.parse(headers['set-cookie'])];

                this.emit('setCookie',cookies);
            }
        }
    }

    withUrl(url){
        this.baseUrl = url;
        this._url = '';
        return this;
    }

    withHttpContext(context){
        context.onClient(this);
        return this;
    }

    static resolveUrl(base,to){
        let toData =  HttpClient.urlParser.parse(to);
        if(toData.host||toData.hostname){
            return to;
        }else{
            return HttpClient.urlParser.resolve(base,to);
        }
    }

    buildUrl(baseUrl,params){
        var urlData = HttpClient.urlParser.parse(baseUrl, true, true);
        urlData.search = '';
        if(params)
            _.each(params,(value,key)=>{
                urlData.query[key] = value;
            });
        return HttpClient.urlParser.format(urlData);
    }

    overwriteGetParams(url,value){
        var urlData = HttpClient.urlParser.parse(url, true, true);
        if(!urlData)
            return url;

        delete urlData.search;
        _.each(urlData.query, function (q, k) {
            urlData.query[k] = value;
        });
        return HttpClient.urlParser.format(urlData);
    }

    execute(){
        var _client = this;
        this._url = '';
        var url = this.getUrl();
        HttpClient.listener.emit('beforeExecute',this,url);
        this.emit('beforeExecute');

        HttpClient.totalCount++; HttpClient.handlersCount++;

        var httpOptions = {timeout:this.timeout,followRedirects:false,
            encoding:this.encoding,npmRequestOptions:{strictSSL : false,rejectUnauthorized: false}};
        if(this.proxy&&this.proxy.ip){
            var protocol = this.proxy.protocol;
            var proxyUrl = protocol+'://';
            if(this.proxy.login){
                proxyUrl+=this.proxy.login+':'+this.proxy.pass+'@';
            }
            proxyUrl+=this.proxy.ip+':'+this.proxy.port;
            httpOptions.npmRequestOptions.agent = new HttpClient.ProxyAgent(proxyUrl);
            if(protocol=='http'||protocol=='https')
                httpOptions.npmRequestOptions.tunnel = false;
        }else{
            httpOptions.npmRequestOptions.pool = HttpClient.npmRequestPool;
        }
        if(this.gzip){
            httpOptions.npmRequestOptions.gzip = this.gzip;
        }

        if(this.useCookies) {
            var jar = HttpClient.npmRequest.jar();
            if (this.cookies) {
                for(var cookieKey in this.cookies){
                    try {
                        var cookie = this.cookies[cookieKey];
                        if(!isset(cookie.TTL)){
                            cookie = new HttpClient.Cookie(cookie);
                        }
                        jar.setCookie( cookie.toString() , url);
                    } catch (e) {
                        //console.log(e.stack );
                    }
                }
            }
            httpOptions.npmRequestOptions.jar = jar;
        }

        var formData = null;
        if(!_.isEmpty(this.files)){
            if(this.httpMethod!=HttpClient.METHOD_PUT)
                this.withHttpMethod( HttpClient.METHOD_POST );
            if(!_.isEmpty(this.postData) ){
                formData = {};
                for(var postKey in this.postData){
                    formData[postKey] = this.postData[postKey];
                }
                this.postData = null;
            }

            if(this.formContentType==HttpClient.FORM_MULTIPART) {
                formData = formData || {};
                _.each(this.files, function (file) {
                    formData[file.name] = {
                        value: file.value(),
                        options: {
                            filename: file.filename,
                            contentType: file.contentType,
                        }
                    }
                });
            }else{
                var file = this.files[0];
                httpOptions.npmRequestOptions.body = file.value();
                this.withHeader('Content-Type',file.contentType,true);
            }
        }

        if(this.httpMethod==HttpClient.METHOD_POST) {
            if(this.formContentType==HttpClient.FORM_URLENCODED_UTF8){
                this.withHeader('Content-Type','application/x-www-form-urlencoded; charset=UTF-8',true);
            }
            if(this.formContentType==HttpClient.FORM_URLENCODED){
                this.withHeader('Content-Type','application/x-www-form-urlencoded',true);
            }
            if(this.formContentType!=HttpClient.POST_SINGLEFILE) {
                if (formData) {
                    httpOptions.npmRequestOptions.formData = formData;
                } else if (this.postData) {
                    if (this.formContentType == HttpClient.FORM_MULTIPART)
                        httpOptions.npmRequestOptions.formData = JSON.parse(JSON.stringify(this.postData));
                    else
                        httpOptions.npmRequestOptions.form = this.postData;
                }
            }
        }
        for(var key in this.npmRequestOptions)
            httpOptions.npmRequestOptions[key] = this.npmRequestOptions[key];

        httpOptions.headers = this.headers;

        return new Promise((resolve,reject)=>{
            if(this.proxy){
                if(_client.proxy.onSuccess) {
                    var onSuccess = function () {
                        _client.proxy.onSuccess();
                    };
                    this.on('success', onSuccess);
                }
                if(_client.proxy.onError) {
                    this.on('error', function () {
                        _client.proxy.onError();
                    });
                }
            }

            this.once('response',function(err,content){
                if(err)
                    return reject(err);
                return resolve(content);
            });

            this.emit('httpOptions',httpOptions);
            try {
                httpCall(
                    this.getHttpMethod(),
                    url,
                    httpOptions,
                    function (error, result) {
                        if (_client.useCookies) {
                            _client.doIncomingCookies(result);
                        }
                        HttpClient.handlersCount--;
                        HttpClient.requestedCount++;

                        if (!result && !error)
                            error = new Error('Empty content error while HttpClient Request');
                        if (!error) {
                            if (_client.followLocation && result && result.headers && [302, 301,303,307].indexOf(result.statusCode) != -1
                                && result.headers.location && _client.redirectsCount < 20) {
                                _client.redirectsCount++;
                                _client.httpMethod = HttpClient.METHOD_GET;
                                _client.postData = {};
                                _client.files = [];
                                _client.baseUrl = HttpClient.resolveUrl(url, result.headers.location);
                                _client.getParams = {};
                                _client.emit('location', result);
                                _client._url = '';

                                return _client.execute({redirect:true});
                            } else
                                _client.emit('success', result);
                        } else {
                            _client.emit('error', error, result);
                        }
                        HttpClient.listener.emit('afterExecute');
                        _client.emit('response', error, result);
                    }
                );
            }catch(e){
                setTimeout(function(){
                    _client.emit('error', e, null);
                    reject(e);
                },100);
            }
        });

    }


}

HttpClient.METHOD_GET = 'GET';
HttpClient.METHOD_POST = 'POST';
HttpClient.METHOD_PUT = 'PUT';

HttpClient.totalCount = 0;
HttpClient.handlersCount = 0;
HttpClient.requestedCount = 0;
HttpClient.npmRequestPool = {maxSockets: 1000};
HttpClient.urlParser = require('url');
HttpClient.DEFALT_TIMEOUT = 5*60*1000;
HttpClient.ProxyAgent = require('proxy-agent');
HttpClient.npmRequest = require('request');
//HttpClient.npmRequest.debug = true;
HttpClient.Cookie = require('tough-cookie').Cookie;
HttpClient.FORM_URLENCODED='FORM_URLENCODED';
HttpClient.FORM_MULTIPART = 'FORM_MULTIPART';
HttpClient.FORM_URLENCODED_UTF8='FORM_URLENCODED_UTF8';
HttpClient.POST_SINGLEFILE = 'POST_SINGLEFILE';

HttpClient.listener = new EventEmitter();
HttpClient.listener.setMaxListeners(200);
HttpClient.listener.on('error',()=>{});

