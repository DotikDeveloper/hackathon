import {Transform} from 'stream';
import {get as safeGet} from 'lodash';
import {decodeBuffer} from "../../../server/lib/utils";
import {ReaderHeader,ReaderHeaders} from "./headers";
import _ from 'underscore';

export default
class DbfTransform extends Transform{
    constructor(options){
        super({
            readableObjectMode: true,
            writableObjectMode: false
        });
        this.options = options != null ? options : {};
        this.encoding = safeGet(options,'encoding','utf8');
        this.deleted = true;//safeGet(options,'deleted',true);

        this.dbf={
            start:0,
            headers:{},
            state:'parseHeaders',
            states:{
                parseHeaders:'parseHeaders',
                parseFields:'parseFields',
                parseData:'parseData'
            },
            headersBuffer:Buffer.alloc(0),
            dataBuffer:Buffer.alloc(0)
        }
    }

    _transform(data, encoding, callback){
        try {
            if (this.dbf.state != this.dbf.states.parseData) {
                this.dbf.headersBuffer = Buffer.concat ([this.dbf.headersBuffer, data]);

                if (this.dbf.state == this.dbf.states.parseHeaders) {
                    if (this.dbf.headersBuffer.length < 12)
                        return callback ();
                    const headersBuffer = this.dbf.headersBuffer;
                    this.dbf.headers.type = decodeBuffer (headersBuffer.slice (0, 1), this.encoding);
                    this.dbf.headers.dateUpdated = this.parseDate (headersBuffer.slice (1, 4));
                    this.dbf.headers.numberOfRecords = this.convertBinaryToInteger (headersBuffer.slice (4, 8));
                    this.dbf.headers.start = this.convertBinaryToInteger (headersBuffer.slice (8, 10));
                    this.dbf.headers.recordLength = this.convertBinaryToInteger (headersBuffer.slice (10, 12));
                    this.dbf.state = this.dbf.states.parseFields;
                }

                if (this.dbf.state == this.dbf.states.parseFields) {
                    if (this.dbf.headersBuffer.length < this.dbf.headers.start)
                        return callback ();

                    this.dbf.headers.fields = [];
                    let i, j, ref;
                    for (i = j = 32, ref = this.dbf.headers.start - 32; j <= ref; i = j += 32) {
                        const fieldBuf = this.dbf.headersBuffer.slice (i, i + 32);
                        const field = this.parseFieldSubRecord (fieldBuf);
                        this.dbf.headers.fields.push (field);
                    }
                    this.dbf.dataBuffer = this.dbf.headersBuffer.slice (this.dbf.headers.start);
                    this.dbf.state = this.dbf.states.parseData;
                    this.dbf.sequenceNumber = 0;
                    if (this.options.header) {
                        const headers = new ReaderHeaders ();
                        _.each (this.dbf.headers.fields, (rawHeader) => {
                            headers.push (new ReaderHeader (rawHeader));
                        });
                        return callback (null, headers);
                    }
                    return callback ();
                }
            }

            this.dbf.dataBuffer = Buffer.concat ([this.dbf.dataBuffer, data]);

            if (this.dbf.state == this.dbf.states.parseData) {
                this.parseData ();
            }
            callback ();
        }catch (e) {
            callback(e);
        }
    }

    _flush(callback){
        this.parseData();
        callback();
    }

    parseData(){
        if(this.dbf&&!_.isEmpty(this.dbf.dataBuffer)){
            const chunks = this.chunks(this.dbf.dataBuffer,this.dbf.headers.recordLength);
            this.dbf.dataBuffer = Buffer.alloc(0);
            _.each(chunks,(chunk)=>{
                if(chunk.length==this.dbf.headers.recordLength){
                    const record = this.parseRecord(++this.dbf.sequenceNumber, chunk);
                    if(!record||(!this.deleted&&record['@deleted'] ))
                        return;
                    if(!this._writableState.ended) {
                        this.push (record.fields);
                    }
                }else{
                    this.dbf.dataBuffer = chunk;
                }
            });
        }
    }

    chunks(buffer, chunkSize) {
        const result = [];
        const len = buffer.length;
        let i = 0;
        while (i < len) {
            result.push(buffer.slice(i, i += chunkSize));
        }
        return result;
    }

    parseDate(buffer) {
        let day, month, year;
        year = 1900 + this.convertBinaryToInteger(buffer.slice(0, 1));
        month = (this.convertBinaryToInteger(buffer.slice(1, 2))) - 1;
        day = this.convertBinaryToInteger(buffer.slice(2, 3));
        return new Date(year, month, day);
    }

    parseFieldSubRecord(buffer) {
        return {
            //name: ((buffer.slice 0, 11).toString @encoding).replace /[\u0000]+$/, ''
            //type: (buffer.slice 11, 12).toString @encoding
            // eslint-disable-next-line no-control-regex
            name: decodeBuffer(buffer.slice(0, 11), this.encoding).replace(/[\u0000]+$/, ''),
            type: decodeBuffer(buffer.slice(11, 12), this.encoding),
            displacement: this.convertBinaryToInteger(buffer.slice(12, 16)),
            length: this.convertBinaryToInteger(buffer.slice(16, 17)),
            decimalPlaces: this.convertBinaryToInteger(buffer.slice(17, 18))
        };
    }

    convertBinaryToInteger(buffer) {
        if(buffer.length<4){
            let alloc = Buffer.alloc(4-buffer.length,0);
            buffer = Buffer.concat([buffer,alloc]);
        }
        return buffer.readInt32LE(0);
    }

    parseRecord(sequenceNumber, buffer) {
        let field, i, len, loc, record, ref;
        record = {
            '@sequenceNumber': sequenceNumber,
            '@deleted': ( (buffer.slice(0, 1))[0] === 42 || (buffer.slice(0, 1))[0] === '*' ) ? true : false,
            fields:[]
        };
        loc = 1;
        ref = this.dbf.headers.fields;
        for (i = 0, len = ref.length; i < len; i++) {
            field = ref[i];
            record.fields.push( this.parseField(field,buffer.slice(loc, loc += field.length)) );
        }
        return record;
    }

    /**@param {Buffer} buffer*/
    parseField(field, buffer) {
       if(field.type==='N'||field.type==='F'){
            let firstNullIndex = buffer.indexOf(0);
            if( firstNullIndex>-1 ){
                buffer = buffer.slice(0,firstNullIndex)
            }
        }
        let value = decodeBuffer(buffer, this.encoding).trim();
        if (field.type === 'N') {
            value = Number(value);
        } else if (field.type === 'F') {
            value = Number(value);
            //value = value === +value && value === (value | 0) ? parseInt(value, 10) : parseFloat(value, 10);
        }
        return value;
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