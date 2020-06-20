import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";
import vmPlugin from "../../../server/mPlugins/vmPlugin";

/**
 * @constructor CustomRoutes
 * @property {string} name Имя
 * @property {object} rules Правила

 * @property {string} route Объект роута
 * @property {string} vueTemplate Шаблон Vue
 * @property {string} user_id ID владельца
 * @property {Users} user
 **/
const CustomRoutesSchema = new Schema ({
    name: {
        type: String,
        required: [true, 'Имя обязательно'],
        unique: true,
    },
    rules: {
        type: Schema.Types.Mixed,
        default () {
            return {
                "condition": "AND",
                "rules": [],
                "valid": true
            }
        }
    },
    route: {
        type: String,
        validate: codeValidate,
    },
    vueTemplate: {
        type: String,
    },
    user_id: {
        type: String,
        required: [true, 'Владелец обязателен'],
    },
});


CustomRoutesSchema.virtual ('user', {
    ref: 'users',
    localField: 'user_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});
CustomRoutesSchema.plugin(vmPlugin,{});

const CustomRoutes = new mongoose.model ('customRoutes', CustomRoutesSchema, 'customRoutes');
CustomRoutes.label = 'Пользовательские роуты';
export default CustomRoutes;