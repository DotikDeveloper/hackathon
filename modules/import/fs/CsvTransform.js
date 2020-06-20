import {Parser as CsvParser} from 'csv-parse';
import iconv from 'iconv-lite';
import _ from 'underscore';
import {ENCODINGS} from "../../../lib/enums";
import {get as safeGet} from 'lodash';
import {ReaderHeaders,ReaderHeader} from "./headers";

/**
 * @name MalibunCsvTransformOptions
 * @property {string} delimiter
 * @property {boolean} header
 * @property {string} encoding
 * @property {boolean} disableQuote
 * */

export default class CsvTransform extends CsvParser{
    /**@param {MalibunCsvTransformOptions} options*/
    constructor(options){
        options=options||{};
        let superOptions = {
            delimiter: options.delimiter || ';' ,
            columns: null,
            auto_parse_date: false,
            auto_parse: false,//TODO true проверить
            relax:true,
            relax_column_count:true//TODO
        };
        if(options.disableQuote){
            superOptions.quote=null;
        }
        super(superOptions);
        this.firstLineIsHeader = options.header || false;
        this.headerParsed = false;

        this.on('pipe',(readable)=>{
            if(readable.encodingChanged)
                return;

            readable.unpipe(this);
            const encoding = safeGet(options,'encoding',ENCODINGS.utf8.key);
            const source = encoding==ENCODINGS.utf8.key ? readable : readable.pipe(iconv.decodeStream(encoding));
            source.encodingChanged=true;
            source.pipe(this);
        });
    }

    push(data){
        if(data&&this.firstLineIsHeader&&!this.headerParsed){
            this.headerParsed = true;
            const readerHeaders = new ReaderHeaders();
            _.each(data,(item)=>{
                readerHeaders.push( new ReaderHeader(item) );
            });
            data = readerHeaders;
        }
        return super.push(data);
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

CsvTransform.ReaderHeaders = ReaderHeaders;