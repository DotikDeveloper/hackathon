import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";


/**
 * @constructor FoodSources
 * @property {string} name Имя
 * @property {string} type_id Тип
 * @property {object} data

 * @property {Date} created Время создания
 * @property {Date} parsed Время последней проверки записей
 * @property {string} geoNames Гео регионы
 * @property {boolean} active Активен
 * @property {FoodSourceTypes} foodSourceType
 **/
const FoodSourcesSchema = new Schema ({
    name: {
        type: String,
    },
    type_id: {
        type: String,
        required: [true, 'Тип источника обязателен'],
    },
    data: {},

    created: {
        type: Date,
    },
    parsed: {
        type: Date,
    },
    geoNames: {
        type: [String],
    },
    active: {
        type: Boolean,
        default () {
            return true;
        },
    },
});


FoodSourcesSchema.virtual ('foodSourceType', {
    ref: 'foodSourceTypes',
    localField: 'type_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});


const FoodSources = new mongoose.model ('foodSources', FoodSourcesSchema, 'foodSources');
FoodSources.label = 'Источники фудшеринга';
export default FoodSources;