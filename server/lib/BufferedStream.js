const {Transform} = require('stream');
import _ from 'underscore';

export default class BufferedStream extends Transform {
    constructor(options) {
        super (options);
        this.bufferSize = 0;
        this.buffer = [];
        this.limit=0;
        this.dataCounter = 0;
        this.delay = 0;
        this.skip = 0;
        this.filter = null;
    }

    wrapCallback(nativeCallback){
        let delay = this.delay;
        if(!delay)
            return nativeCallback;
        return function () {
            let args = arguments;
            setTimeout(()=>{
                nativeCallback.apply(this,args);
            },delay);
        }
    }
    wrapData(data){
        this.dataCounter++;
        if(this.limit>0&&this.limit<this.dataCounter){
            this.on('error',()=>{});
            this.end();
            return;
        }
        if(this.bufferSize==0)
            return data;
        this.buffer.push(data);
        if(this.buffer.length<this.bufferSize)
            return null;
        let buf = this.buffer;
        this.buffer=[];
        return buf;
    }

    _transform(data, encoding, callback){
        if(this.filter&&!this.filter.apply(this,[data,encoding])){
            return callback();
        }
        if(this.skip>0){
            this.skip--;
            return callback();
        }
        data = this.wrapData(data);
        if(data){
            callback = this.wrapCallback(callback);
            return callback(null,data);
        }
        return callback();
    }

    _flush(callback){
        callback = this.wrapCallback(callback);
        if(!_.isEmpty(this.buffer)){
            let buf = this.buffer;
            this.buffer=[];
            return callback(null,buf);
        }
        return callback();
    }

    /**@returns {this}*/
    withFilter(filter){
        this.filter = filter;
        return this;
    }

    /**@returns {this}*/
    withBufferSize(size=0){
        this.bufferSize=size;
        return this;
    }

    /**@returns {this}*/
    withLimit(limit){
        this.limit=limit;
        return this;
    }
    /**@returns {this}*/
    withSkip(skip){
        this.skip = skip;
        return this;
    }
    /**@returns {this}*/
    withDelay(delay){
        if(delay<0)
            delay = 0;
        this.delay=delay;
        return this;
    }

    readAll(){
        return new Promise((resolve,reject) => {
            let data = [];
            this.on('data',(chunk)=>{
                data.push(chunk);
            });
            this.once('finish',()=>{
                resolve(data);
            });
            this.once('error',(err)=>{
                if(err.message!='write after end')
                    reject(err);
            });
        });
    }


}