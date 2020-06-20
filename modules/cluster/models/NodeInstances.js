import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";
import {NodeInstanceStates} from "../enums";
import VMRunnerSystemContext from "../../vmrunner/classes/VMRunnerSystemContext";
import {VMRunner} from 'vmrunner';
/**
 * @constructor NodeInstances
 * @property {string} server_id
 * @property {string} node_id
 * @property {object} meta

 * @property {string} base_url
 * @property {string} state
 * @property {string} stateChanged
 * @property {Servers} server
 * @property {Nodes} node
 **/
const NodeInstancesSchema = new Schema ({
    server_id: {
        type: String,
        required: [true, 'Сервер обязателен'],
    },
    node_id: {
        type: String,
        required: [true, 'Нода обязательна'],
    },
    meta: {},

    base_url: {
        type: String,
    },
    state: {
        type: String,
        default () {
            return NodeInstanceStates.UNKNOWN.key;
        },
    },
    stateChanged: {
        type: Date,
        default () {
            return null;
        },
    },
});


NodeInstancesSchema.virtual ('server', {
    ref: 'servers',
    localField: 'server_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

NodeInstancesSchema.virtual ('node', {
    ref: 'nodes',
    localField: 'node_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

NodeInstancesSchema.pre('save', async function() {
    /**@this {NodeInstances}*/
    if(this.isModified('state')){
        this.stateChanged = new Date();
    }
    if(!this.populated('node')){
        await this.populate('node').execPopulate();
    }
    if(!this.populated('server')){
        await this.populate('server').execPopulate();
    }
    if(this.node){
        let scope = new VMRunnerSystemContext();
        const vmRunner = new VMRunner (scope)
        .withThrow (true)
        .withConvertResult (true);

        this.base_url = await vmRunner.run(this.node.baseUrlExpr,this);
    }
});
const NodeInstances = new mongoose.model ('nodeInstances', NodeInstancesSchema, 'nodeInstances');
NodeInstances.label = 'Инстансы нод';
export default NodeInstances;