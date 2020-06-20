const {Transform} = require('stream');
import XLSX from 'xlsx';
import {ReaderHeader,ReaderHeaders} from "./headers";
import _ from 'underscore';

export default
class ExcelTransform extends Transform{
    constructor(options){
        super({
            readableObjectMode: true,
            writableObjectMode: false
        });
        this.options = options || {};
        this.buffers = [];
    }

    _transform(data, encoding, callback){
        this.buffers.push(data);
        return callback();
    }

    _flush(callback){
        if(_.isEmpty(this.buffers))
            return callback();
        let buffer = Buffer.concat(this.buffers);
        let workbook = XLSX.read(buffer, {type:"buffer"});
        let first_sheet_name = workbook.SheetNames[0];
        let worksheet = workbook.Sheets[first_sheet_name];
        let data = XLSX.utils.sheet_to_json(worksheet,{header:1,defval:''});

        _.each(data,(record,index)=>{
            if(index==0&&this.options.header){
                let readerHeaders = new ReaderHeaders();
                _.each(record,(item)=>{
                    readerHeaders.push( new ReaderHeader(item) );
                });
                record = readerHeaders;
            }
            this.push(record);
        });
        callback();
    }

    recordsCount(){
        return new Promise((resolve,reject)=>{
            let count = 0;
            this.on('data',(data)=>{
                if(data instanceof ReaderHeaders)
                    return;
                count++;
            });
            this.once('finish',()=>{
                resolve(count);
            });
            this.once('error',(err)=>{
                reject(err);
            });
        });
    }
}