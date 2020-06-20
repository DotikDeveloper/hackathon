import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';
import _ from 'underscore';

function exists(dir,filename){
    let absoluteName = dir && filename ? path.resolve(path.join(dir, filename)) : dir;

    return new Promise((resolve)=>{
        fs.access(absoluteName, fs.F_OK, (err) => {
            return resolve(!err);
        });
    });
}

const UNMISTAKABLE_CHARS = "23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz";
function meteorRnd(){
    const arr = [];
    for(let i=0;i<17;i++){
        let index = Math.floor(Math.random() * UNMISTAKABLE_CHARS.length);
        arr.push(UNMISTAKABLE_CHARS[index]);
    }
    return arr.join('');
}

function isset(obj){
    return obj===null || typeof(obj)!=='undefined';
}

function setIntervalImmediate(handler,interval){
    handler();
    setInterval(handler,interval);
}

function decodeBuffer(buffer, encoding) {
    encoding = iconv.encodingExists(encoding) ? encoding : "utf-8";
    if(!Buffer.isBuffer(buffer))
        return buffer;
    return iconv.decode(buffer, encoding);
}

function errorString(err){
    if(!err)
        return '';
    if(_.isString(err))
        return err;
    if(_.isError(err)&&err.message)
        return err.message;
    return String(err);
}

export {
    exists,meteorRnd,isset,setIntervalImmediate,decodeBuffer,errorString
}