import {get as safeGet} from 'lodash';
import {ENCODINGS,FILE_TYPES} from "../../../lib/enums";

import fs from 'fs';
import ExcelTransform from "./ExcelTransform";
import CsvTransform from "./CsvTransform";
import DbfTransform from "./DbfTransform";

export default class ImportReader{
    /**@param {CallImports} callImport */
    static forImport(callImport,file){
        var fileType = safeGet(callImport,'options.fileType') || FILE_TYPES.csv.key;
        var delimiter = safeGet(callImport,`options.${fileType}.delimiter`) || ';';
        var skipHeader =  safeGet(callImport,`options.${fileType}.skipline`,false);
        let disableQuote = safeGet(callImport,`options.${fileType}.disableQuote`,false);

        var encoding =  safeGet(callImport,`options.${fileType}.encoding`,ENCODINGS.utf8.key);
        var filePath =  safeGet(file,'versions.original.path',null);
        if(!filePath)
            return null;
        var readStream = null;
        if(fileType===FILE_TYPES.xlsx.key){
            readStream = new ExcelTransform({
                header: skipHeader
            });
        }else if(fileType===FILE_TYPES.csv.key) {
            readStream = new CsvTransform({
                encoding: encoding,
                header: skipHeader,
                delimiter: delimiter,
                disableQuote:disableQuote
            });
        }else{
            readStream = new DbfTransform({
                encoding: encoding,
                deleted:false,
                header: true,
            });
        }

        return fs.createReadStream(filePath)
            .pipe(readStream);


    }


}


