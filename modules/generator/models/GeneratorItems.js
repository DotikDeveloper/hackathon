import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";
import uniqueValidator from 'mongoose-unique-validator';
/**
 * @constructor GeneratorItems
 * @property {GeneratorItems} template
 **/
const GeneratorItemsSchema = new Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },

    template_id:{
        type:String,
        required:true,
    },

    templateData:{},

    created:{
        type:Date,
        default() {
            return new Date ()
        }
    }


});

GeneratorItemsSchema.virtual('template', {
    ref:'generatorTemplates',
    localField: 'template_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});
GeneratorItemsSchema.plugin(uniqueValidator,{ message: '{PATH} должно быть уникальным' });

const GeneratorItems = new mongoose.model('generatorItems',GeneratorItemsSchema,'generatorItems');
GeneratorItems.label='Заполненные шаблоны генератора';
export default GeneratorItems;