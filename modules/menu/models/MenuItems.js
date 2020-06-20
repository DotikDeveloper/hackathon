import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";
import vmPlugin from "../../../server/mPlugins/vmPlugin";

const MenuItemConnectionSchema = new Schema({
    _id:String,
    to:{type:String},
    priority:Number,
    rules:{
        type:Schema.Types.Mixed,
        default:null
    }
});

/**
 * @description Сущности элементов меню
 * @category menu
 * @subcategory models
 * @constructor MenuItems
 * @property {string} menu_id
 * @property {string} user_id
 * @property {number} top
 * @property {string} left
 * @property {string} index
 * @property {string} block_id
 * @property {string} label
 * @property {object} data
 * @property {MenuItemConnectionSchema[]} connections
 * @property {Menus} menu
 * @property {Users} user
 * @property {MenuBlocks} menuBlock
 *
 **/
const MenuItemsSchema = new Schema ({
    menu_id: {
        type: String,
        required: [true, 'Меню обязательно'],
    },
    user_id: {
        type: String,
        required: [true, 'Владелец обязателен'],
    },
    top: {
        type: Number,
        default () {
            return 0;
        },
    },
    left: {
        type: Number,
        default () {
            return 0;
        },
    },
    index: {
        type: String,
    },
    block_id: {
        type: String,
        required: [true, 'Блок обязателен'],
    },
    label: {
        type: String,
        default () {
            return '';
        },
    },
    data: {},
    connections:{type:[MenuItemConnectionSchema],default:[]}
});


MenuItemsSchema.virtual ('menu', {
    ref: 'menus',
    localField: 'menu_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

MenuItemsSchema.virtual ('user', {
    ref: 'users',
    localField: 'user_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

MenuItemsSchema.virtual ('menuBlock', {
    ref: 'menuBlocks',
    localField: 'block_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

MenuItemsSchema.plugin(vmPlugin,{});

const MenuItems = new mongoose.model ('menuItems', MenuItemsSchema, 'menuItems');
MenuItems.label = 'Элементы меню';
export default MenuItems;