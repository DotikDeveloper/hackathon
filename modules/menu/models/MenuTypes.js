import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";
import vmPlugin from "../../../server/mPlugins/vmPlugin";

/**
 * @category menu
 * @subcategory models
 * @constructor MenuTypes
 * @property {string} id
 * @property {string} name
 * @property {string} image_file_id
 * @property {string} user_id
 * @property {string} ctxClassExpr
 * @property {string} supertype
 * @property {string} menuVfgSchema VFG схема дополнительных полей меню
 *
 * @property {Users} user
 * @property {ImageFiles} imageFile
 * @property {MenuBlocks[]} menuBlocks
 **/
const MenuTypesSchema = new Schema ({
    name: {
        type: String,
        required: [true, 'Имя обязательно'],
        unique: true,
    },
    image_file_id: {
        type: String,
    },
    user_id: {
        type: String,
        required: [true, 'Пользователь обязателен'],
    },
    ctxClassExpr: {
        type: String,
        default () {
            return null;
        },
    },
    supertype: {
        type: String,
        required: [true, 'Это поле обязательно'],
    },

    menuVfgSchema:{
        type:String,
        default:null,
        validate:codeValidate
    }
});


MenuTypesSchema.virtual ('user', {
    ref: 'users',
    localField: 'user_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

MenuTypesSchema.virtual ('imageFile', {
    ref: 'imageFiles',
    localField: 'image_file_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

MenuTypesSchema.virtual ('menuBlocks', {
    ref: 'menuBlocks',
    localField: '_id',
    foreignField: 'menu_type_ids',
    justOne: false,
    options: {}
});

MenuTypesSchema.plugin(vmPlugin,{});

const MenuTypes = new mongoose.model ('menuTypes', MenuTypesSchema, 'menuTypes');
MenuTypes.label = 'Типы меню';
export default MenuTypes;