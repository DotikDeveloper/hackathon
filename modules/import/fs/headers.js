import {FIELD_CALLS_TYPE} from "../../../lib/enums";
import _ from 'underscore';

/**
 * @property {string} name
 * @property {string} type
 * */

class ReaderHeader{
    constructor(data){
        this.type = null;
        if(_.isString(data)){
            this.name = data;
            this.type = FIELD_CALLS_TYPE.String.key;
        }else{
            this.name = data.name;
            this.type = (data.type==='F' || data.type==='N')
                ? FIELD_CALLS_TYPE.Number.key
                : FIELD_CALLS_TYPE.String.key;
        }
    }
}

class ReaderHeaders extends Array{

}

export {
    ReaderHeader,
    ReaderHeaders
}