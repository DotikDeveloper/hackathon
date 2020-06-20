import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";


/**
 * @constructor YaMarketCategories
 * @property {string} name Имя категории
* @property {number} ID ID маркета
* @property {string} link Ссылка
* @property {string} food_category_id ID категории фудшеринга
* @property {FoodCategories} foodCategory
 **/
const YaMarketCategoriesSchema = new Schema({
		name:{
		type:String,
		required:true,
	},
	ID:{
		type:Number,
		required:[true,'ID маркета обязательно'],
		unique:true,
	},
	link:{
		type:String,
	},
	food_category_id:{
		type:String,
		default(){ return null; },
	},
});


YaMarketCategoriesSchema.virtual('foodCategory', {
    ref:'foodCategories',
    localField: 'food_category_id',
    foreignField: '_id',
    justOne: true,
    options: {
		
    }
});


const YaMarketCategories = new mongoose.model('yaMarketCategories',YaMarketCategoriesSchema,'yaMarketCategories');
YaMarketCategories.label='Категории ЯМаркета';
export default YaMarketCategories;