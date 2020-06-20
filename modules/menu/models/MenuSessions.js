import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";


/**
 * Сохраненные данные диалогов меню
 * @category menu
 * @subcategory models
 * @constructor MenuSessions
 * @property {object} meta Информация, специфичная для каждого сервиса

 * @property {string} menu_id ID меню
 * @property {Date} created Время создания
 * @property {string} user_id ID пользователя владельца меню
 * @property {string} serialized Сериализованные данные контекста
 * @property {Users} user Владелец
 * @property {Menus} menu Меню
 **/
const MenuSessionsSchema = new Schema ({
    meta: {},

    menu_id: {
        type: String,
        required: [true, 'Меню обязательно'],
    },
    created: {
        type: Date,
        default () {
            return new Date ();
        },
    },
    user_id: {
        type: String,
        required: [true, 'Владелец обязателен'],
    },
    serialized: {
        type: String,
        default () {
            return '';
        },
    },
    menu_item_id:{
        type:String,default:null
    }
});


MenuSessionsSchema.virtual ('user', {
    ref: 'users',
    localField: 'user_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

MenuSessionsSchema.virtual ('menu', {
    ref: 'menus',
    localField: 'menu_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});


const MenuSessions = new mongoose.model ('menuSessions', MenuSessionsSchema, 'menuSessions');
MenuSessions.label = 'Сохраненные данные диалогов';
export default MenuSessions;