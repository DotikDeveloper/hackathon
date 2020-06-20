import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";

/**
 * @name GeneratorTemplatesChild
 * @property {string} _id
 * @property {boolean} multiple
 * */
/**
 * @constructor GeneratorTemplates
 * @property {GeneratorTemplates[]} childrenTemplates
 * @property {GeneratorTemplatesChild[]} children
 **/
const GeneratorTemplatesSchema = new Schema({
    name:{
        type:String,
        required:true,
        unique:true,
    },
    description:{
        type:String,default:null
    },
    isRoot:{
        type:Boolean,default:false
    },
    schemaExpression:{
        type:String,
        required: [true, 'Код обязателен'],
        validate:codeValidate
    },
    helpersExpression:{
        type:String,
        validate:codeValidate
    },
    children:[new Schema({
        _id:{type: String,required:[true,'Дочерний шаблон обязателен для заполнения']},
        multiple:{type:Boolean,default:false}
    })],
    templateItems:[new Schema({
        path:{
            type:String,
            required:[true,'Путь обязателен для заполнения']
        },
        template:{
            type:String,required:false,default:''
        },
    })]
});

GeneratorTemplatesSchema.virtual('childrenTemplates', {
    ref:'generatorTemplates',
    localField: 'children._id',
    foreignField: '_id',
    justOne: false,
    options: {

    }
});

const GeneratorTemplates = new mongoose.model('generatorTemplates',GeneratorTemplatesSchema,'generatorTemplates');
export default GeneratorTemplates;