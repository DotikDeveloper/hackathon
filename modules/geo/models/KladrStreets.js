import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";


/**
 * @constructor KladrStreets
 * @property {string} name Имя
 * @property {string[]} lemmas Лематизированные данные
 * @property {string[]} tokens
 **/
const KladrStreetsSchema = new Schema ({
    name: {
        type: String,
    },
    lemmas: {
        type: [String],
    },
    tokens: {
        type: [String],
    },
});

const KladrStreets = new mongoose.model ('kladrStreets', KladrStreetsSchema, 'kladrStreets');
KladrStreets.label = 'Улицы КЛАДР';
export default KladrStreets;