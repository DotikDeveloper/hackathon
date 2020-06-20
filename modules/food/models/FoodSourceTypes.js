import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";


/**
 * @constructor FoodSourceTypes
 * @property {string} name Имя источника
 * @property {string} image_id Иконка
 * @property {string} user_id Создатель
 * @property {string} sysName Системное имя
 * @property {Users} user
 * @property {ImageFiles} image
 * @property {string} vfgSchema Схема дополнительных полей
 * @property {FoodSources[]} foodSources
 **/
const FoodSourceTypesSchema = new Schema ({
    name: {
        type: String,
    },
    image_id: {
        type: String,
    },
    user_id: {
        type: String,
    },
    sysName: {
        type: String,
        required: [true, 'Системное имя обязательно'],
        unique: true,
    },
	vfgSchema:{
    	type:String,
		validate:codeValidate
	}
});


FoodSourceTypesSchema.virtual ('user', {
    ref: 'users',
    localField: 'user_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

FoodSourceTypesSchema.virtual ('image', {
    ref: 'imageFiles',
    localField: 'image_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

FoodSourceTypesSchema.virtual ('foodSources', {
    ref: 'foodSources',
    localField: '_id',
    foreignField: 'type_id',
    justOne: false,
    options: {}
});

const FoodSourceTypes = new mongoose.model ('foodSourceTypes', FoodSourceTypesSchema, 'foodSourceTypes');
FoodSourceTypes.label = 'Источники ';
export default FoodSourceTypes;