import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";


/**
 * @constructor Settings
 * @property {string} system_name Служебное имя
 * @property {string} label Отображаемое имя
 * @property {object} data Введенные данные

 * @property {string} vfgSchema VFG схема данных
 **/
const SettingsSchema = new Schema ({
    system_name: {
        type: String,
        required: [true, 'Служебное имя обязательно'],
        unique: true,
    },
    label: {
        type: String,
        required: [true, 'Отображаемое имя обязательно'],
        unique: true,
    },
    data: {
        type: Schema.Types.Mixed,
        default () {
            return {};
        }
    },

    vfgSchema: {
        type: String,
        required: true,
        validate: codeValidate,
    },
});

const Settings = new mongoose.model ('settings', SettingsSchema, 'settings');
Settings.label = 'Настройки';
export default Settings;