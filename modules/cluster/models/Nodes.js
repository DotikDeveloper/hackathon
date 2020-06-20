import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";

/**
 * @constructor Nodes
 * @property {string} name
 * @property {string} baseUrlExpr Код получения базового URL инстанса
 * @property {number} port Порт инстанса
 * @property {string} viewComponent Компонент отображения на странице ноды
 * @property {string} paginationComponent Компонент отображения на странице списка нод
 * @property {Servers[]} servers Серверы
 **/
const NodesSchema = new Schema ({
    name: {
        type: String,
        required: [true, 'Имя ноды обязательно'],
        unique: true,
        validate:codeValidate,
    },
    baseUrlExpr: {
        type: String,
        required: [true, 'Это поле обязательно'],
    },
    port: {
        type: Number,
        required: [true, 'Порт обязателен'],
    },
    isDefault:{
        type:Boolean,
        default:false
    },
    viewComponent: {
        type: String,
        validate:codeValidate,
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
});


NodesSchema.virtual ('servers', {
    ref: 'servers',
    localField: '_id',
    foreignField: 'node_ids',
    justOne: false,
    options: {}
});


const Nodes = new mongoose.model ('nodes', NodesSchema, 'nodes');
Nodes.label = 'Ноды';
export default Nodes;