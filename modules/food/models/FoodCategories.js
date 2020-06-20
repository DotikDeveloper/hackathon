import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";


/**
 * @constructor FoodCategories
 * @property {string} name Имя категории
 * @property {string} icon Иконка
 * @property {YaMarketCategories[]} yaMarketCategories
 **/
const FoodCategoriesSchema = new Schema ({
    name: {
        type: String,
        required: [true, 'Имя категории обязательно'],
        unique: true,
    },
    icon: {
        type: String,
        required: [true, 'Иконка обязательна'],
    },
    index:{
        type:Number,
        optional:true,
        default:0
    }
});


FoodCategoriesSchema.virtual ('yaMarketCategories', {
    ref: 'yaMarketCategories',
    localField: '_id',
    foreignField: 'food_category_id',
    justOne: false,
    options: {}
});


const FoodCategories = new mongoose.model ('foodCategories', FoodCategoriesSchema, 'foodCategories');
FoodCategories.label = 'Категории еды';
export default FoodCategories;