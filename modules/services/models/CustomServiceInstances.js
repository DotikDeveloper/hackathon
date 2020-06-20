import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";
import {CustomServiceStates} from "../enums";

/**
 * @category services
 * @subcategory models
 *
 * @constructor CustomServiceInstances
 * @property {string} custom_service_id Пользовательский сервис
 * @property {string} server_id Сервер
 * @property {string} node_id Нода
 * @property {object} meta Метаинформация

 * @property {string} state Состояние
 * @property {Servers} server
 * @property {Nodes} node
 * @property {CustomServices} customService
 **/
const CustomServiceInstancesSchema = new Schema ({
    custom_service_id: {
        type: String,
        required: [true, 'Пользовательский сервис обязателен'],
    },
    server_id: {
        type: String,
        required: [true, 'Сервер обязателен'],
    },
    node_id: {
        type: String,
        required: [true, 'Нода обязательна'],
    },
    meta: {
        type:Schema.Types.Mixed,
        default(){
            return {};
        }
    },
    state: {
        type: String,
        default () {
            return CustomServiceStates.UNKNOWN.key;
        },
    },
});


CustomServiceInstancesSchema.virtual ('server', {
    ref: 'servers',
    localField: 'server_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

CustomServiceInstancesSchema.virtual ('node', {
    ref: 'nodes',
    localField: 'node_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

CustomServiceInstancesSchema.virtual ('customService', {
    ref: 'customServices',
    localField: 'custom_service_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});


const CustomServiceInstances = new mongoose.model ('customServiceInstances', CustomServiceInstancesSchema, 'customServiceInstances');
CustomServiceInstances.label = 'Инстансы пользовательских сервисов';
export default CustomServiceInstances;