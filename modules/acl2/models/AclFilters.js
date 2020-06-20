import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "../../vmrunner";
import {FIELD_BUILDER_TYPE} from "../../../lib/enums";

/**
 * @constructor AclFilters
 **/
const AclFiltersSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    fieldType:{
        type:String,
        enum:FIELD_BUILDER_TYPE.values()
    },
    labelExpression:{
        type:String,
        required: [true, 'Код обязателен'],
        validate:codeValidate
    },
    modelNames:{
        type:[String],
        default(){
            return [];
        }
    },

    mongoPathExpression:{
        type:String,
        required: [true, 'Код обязателен'],
        validate:codeValidate
    },
    mongoValueExpression:{
        type:String,
        required: false,
        validate:codeValidate
    },
});

const AclFilters = new mongoose.model('aclFilters',AclFiltersSchema,'aclFilters');

export default AclFilters;