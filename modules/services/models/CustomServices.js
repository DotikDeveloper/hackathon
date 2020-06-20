import mongoose,{Schema} from 'mongoose';
import observeChangesPlugin from "mongoose-observe";
import vmPlugin from "../../../server/mPlugins/vmPlugin";

/**
 * @category services
 * @subcategory models
 *
 * @constructor CustomServices
 * @extends Schema
 * @property {string} name Имя сервиса
 * @property {string} classExpr Класс, расширяющий {@link AbstractService}
 * @property {string} user_id ID владельца
 * @property {string} viewComponent
 * @property {string} paginationComponent
 * @property {boolean} autostart Автозапуск
 * @property {object} rules Правила автозапуска
 * @property {string} image_file_id ID иконки
 *
 * @property {Users} user Владелец
 * @property {ImageFiles} imageFile Иконка
 **/
const CustomServicesSchema = new Schema ({
    name: {
        type: String,
        required: [true, 'Имя обязательно'],
    },
    classExpr: {
        type: String,
        required: [true, 'Это поле обязательно'],
    },
    user_id: {
        type: String,
        required: [true, 'Владелец обязателен'],
    },
    viewComponent: {
        type: String,
        default () {
            return null;
        },
    },
    paginationComponent: {
        type: String,
        default () {
            return null;
        },
    },
    autostart:{
        type:Boolean,default:false
    },
    rules: {},

    image_file_id: {
        type: String,
    },
});


CustomServicesSchema.virtual ('user', {
    ref: 'users',
    localField: 'user_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

CustomServicesSchema.virtual ('imageFile', {
    ref: 'imageFiles',
    localField: 'image_file_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

CustomServicesSchema.plugin(observeChangesPlugin);
CustomServicesSchema.plugin(vmPlugin,{});

const CustomServices = new mongoose.model ('customServices', CustomServicesSchema, 'customServices');

CustomServices.label = 'Пользовательские сервисы';
export default CustomServices;