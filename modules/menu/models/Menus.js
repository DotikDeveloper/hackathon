import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";
import GeneratorItems from "../../generator/models/GeneratorItems";
import vmPlugin from "../../../server/mPlugins/vmPlugin";
import observeChangesPlugin from "mongoose-observe";
/**
 * @description Сущности меню пользователей
 * @category menu
 * @subcategory models
 *
 * @constructor Menus
 * @property {string} name Имя
 * @property {string} user_id ID пользователя владельца
 * @see {DefaultMenuContext}
 *
 * @property {string} ctxClassExpr Код, возвращающий класс контекста меню, расширяющий DefaultMenuContext либо SerializableMenuContext
 * @property {string} menu_type_id ID типа меню
 * @property {string} data Дополнительные поля меню
 * @property {MenuItems[]} menuItems Элементы меню
 * @property {MenuTypes} menuType Тип меню
 * @property {Users} user
 *
 * @property {Function} runExpression
 **/
const MenusSchema = new Schema ({
    name: {
        type: String,
        required: true,
        async validate (name) {
            if (!name)
                throw new Error ('Имя обязательно');
            let query = Menus.findOne ({name: name});
            if (this.user_id) {
                query.where ('user_id').ne (this.user_id);
            }
            if (this._id) {
                query.where ('_id').ne (this._id);
            }
            let anotherModel = await query;
            if (anotherModel)
                throw new Error (`Имя "${name}" уже используется в другом меню`);
        }
    },
    menu_type_id:{
        type:String,
        required:true
    },
    user_id: {
        type: String,
        required: [true, 'Владелец обязателен'],
    },
    ctxClassExpr: {
        type: String,
        default () {
            return null;
        },
    },
    data:{
        type:Schema.Types.Mixed,
        default(){
            return {};
        }
    }
});

MenusSchema.virtual ('menuType', {
    ref: 'menuTypes',
    localField: 'menu_type_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

MenusSchema.virtual ('user', {
    ref: 'users',
    localField: 'user_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

MenusSchema.virtual ('menuItems', {
    ref: 'menuItems',
    localField: '_id',
    foreignField: 'menu_id',
    justOne: false,
    options: {}
});

MenusSchema.plugin(vmPlugin,{});
MenusSchema.plugin(observeChangesPlugin);

const Menus = new mongoose.model ('menus', MenusSchema, 'menus');
Menus.label = 'Меню';
export default Menus;