import mongoose from 'mongoose';
import observeChangesPlugin from "mongoose-observe";
import {get as safeGet} from "lodash";
import YandexDisk from "/server/lib/YandexDisk";

/**
 * @constructor Servers
 * @property {string} name Имя сервера
 * @property {boolean} isMaster Мастер-сервер
 * @property {boolean} isDefault Сервер по умолчанию. На него попадают все новые пользователи
 * @property {number} available Все доступное место на диске
 * @property {number} free Свободное место на диске
 * @property {number} total Все место на диске
 * @property {string[]} node_ids IDшники нод сервера
 * @property {string} defaultNodeId Нода по умолчанию, сервер стартует с этой ноды, она же обрабатывает http запросы пользователя
 *
 * @property {boolean} isCurrent  Getter, если true то сервер текущий
 * @property {Servers} current Текущий сервер
 * @property {Servers[]} models Все серверы
 * @property {Nodes[]} nodes Все ноды на этом сервере
 * @property {Nodes} defaultNode
 * @property {NodeInstances[]} nodeInstances
 **/
const ServersSchema = new mongoose.Schema({
    name:{
        type: String,
        unique: true,
        required: true
    },
    isMaster:{
        type:Boolean,default:false
    },
    isDefault:{
        type:Boolean,default:false
    },
    available:{
        type:Number,default:0
    },
    free:{
        type:Number,default:0
    },
    total:{
        type:Number,default:0
    },
    node_ids:{
        type:[String]
    },
    defaultNodeId:{
        type:String,
        //required:true
        default:null
    }
});

ServersSchema.virtual ('nodes', {
    ref: 'nodes',
    localField: 'node_ids',
    foreignField: '_id',
    justOne: false,
    options: {}
});

ServersSchema.virtual ('defaultNode', {
    ref: 'nodes',
    localField: 'defaultNodeId',
    foreignField: '_id',
    justOne: true,
    options: {}
});

ServersSchema.virtual ('nodeInstances', {
    ref: 'nodeInstances',
    localField: '_id',
    foreignField: 'server_id',
    justOne: false,
    options: {}
});

ServersSchema.virtual('isCurrent').
    get(function() {
        let currentServer = Servers.current;
        return currentServer && this.id === currentServer.id;
    });

ServersSchema.plugin(observeChangesPlugin);
/***
 * @name Servers
 * @property {string} defaultNodeName
 * */
/**@type {Servers}*/
const Servers = mongoose.model('servers',ServersSchema,'servers');

Object.defineProperty(Servers, 'defaultNodeName', {
    enumerable: false,
    get:function(){
        return 'customer';
    }
});

export default Servers;