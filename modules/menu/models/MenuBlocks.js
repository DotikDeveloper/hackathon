import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";
import _ from 'underscore';
import vmPlugin from "../../../server/mPlugins/vmPlugin";

/**
 * @description Сущности описания блоков меню
 * @category menu
 * @subcategory models
 * @constructor MenuBlocks
 * @property {string} name имя блока
 * @property {string} menu_type_ids типы меню
 * @property {string} user_id id создателя
 * @property {string} image_file_id id файла иконки
 * @property {string} vfgSchema VFG схема генератора форм
 * @property {boolean} addSystemButtons Добавить системные кнопки в форму ввода блока
 * @property {string} serverClass Класс-обработчик на сервере
 * @property {boolean} isSource Может быть источником cоединения в визуальном редакторе
 * @property {boolean} isTarget Может быть целью cоединения в визуальном редакторе
 * @property {Boolean} isRoot Родительский блок
 * @property {Users} user Создатель
 * @property {ImageFiles} imageFile Иконка
 * @property {MenuTypes[]} menuTypes Типы меню
 *
 * @property {Function} runExpression
 **/
const MenuBlocksSchema = new Schema ({
    name: {
        type: String,
        required: true,
        validate: async function (name) {
            if (!name)
                throw new Error ('Имя обязательно');
            let query = MenuBlocks.findOne ({name: name});
            if (this._id) {
                query.where ('_id').ne (this._id);
            }
            if (!_.isEmpty (this.menu_type_ids)) {
                query.where ('menu_type_ids').in (this.menu_type_ids);
            }
            let anotherBlock = await query;
            if (anotherBlock)
                throw new Error (`Имя "${name}" уже используется в блоках одного или нескольких типов меню`);
        }
    },
    menu_type_ids: {
        type: [String],
        required: [true, 'Тип меню обязателен'],
    },
    user_id: {
        type: String,
        required: [true, 'Пользователь обязателен'],
    },
    image_file_id: {
        type: String,
    },
    vfgSchema: {
        type: String,
        required: [true, 'VFG схема генератора форм обязательна'],
    },
    serverClass: {
        type: String,
        required: [true, 'Класс-обработчик обязателен'],
    },
    isSource: {
        type: Boolean,
        default () {
            return true;
        },
    },
    isTarget: {
        type: Boolean,
        default () {
            return true;
        },
    },
    isRoot: {
        type: Boolean,
        default () {
            return false;
        },
    },
    addSystemButtons:{
        type: Boolean,
        default:true
    }
});

MenuBlocksSchema.plugin(vmPlugin,{});

MenuBlocksSchema.virtual ('user', {
    ref: 'users',
    localField: 'user_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

MenuBlocksSchema.virtual ('imageFile', {
    ref: 'imageFiles',
    localField: 'image_file_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

MenuBlocksSchema.virtual ('menuTypes', {
    ref: 'menuTypes',
    localField: 'menu_type_ids',
    foreignField: '_id',
    justOne: false,
    options: {}
});
const MenuBlocks = new mongoose.model ('menuBlocks', MenuBlocksSchema, 'menuBlocks');
MenuBlocks.label = 'Блоки меню';
export default MenuBlocks;