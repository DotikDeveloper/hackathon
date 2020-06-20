const fs = require('fs');
import {Transform} from 'stream';
import _ from 'underscore';
import Path from 'path';
import async from 'async';

class FileStream extends Transform{
    constructor() {
        super ({
            readableObjectMode: true,
            writableObjectMode: true
        });
    }

    _transform(path, encoding, callback) {
        fs.lstat(path,async (err,stat)=>{
            if(err)
                return callback();
            if(!stat.isDirectory()){
                return callback(null,{
                    path:path,
                    stat:stat
                })
            }
            await new Promise((resolve,reject)=>{
                fs.readdir(path, async (err, childPathes) => {
                    if(err)
                        return resolve();
                    this.push({
                        path:path,
                        stat:stat
                    });

                    await async.mapLimit(childPathes, 1, (childPath,cb)=>{

                            let childStream = new FileStream();
                            childStream.on('data',(chunk)=>{
                                this.push(chunk);
                            });
                            childStream.once('finish',()=>{
                                cb();
                            });
                            childStream.once('error',(err)=>{
                                cb();
                            });
                            childStream.end(Path.join(path, childPath));

                    });

                    resolve();
                });
            });
            return callback();
        });
    }
}

let filesCounter = 0;
let totalSize = 0;

let fileStream = new FileStream();
fileStream.on('data',({path,stat})=>{
    filesCounter++;
    totalSize+=stat.size;
    if(filesCounter%10000==0){
        console.log('path:',path,'size:',Number(totalSize/1000000000).toFixed(2));
    }
});
fileStream.end('/var');

fileStream.once('finish',()=>{
    console.log('totalSize:',Number(totalSize/1000000000).toFixed(2),'ГБ');
});