import Servers from "./models/Servers";
import _ from 'underscore';
import {get as safeGet} from 'lodash';
import {defaultLogger} from "../logger";
import {LogLevels, Tags} from "../logger/enums";
import NodeInstances from "./models/NodeInstances";

async function load(){
    let assocModels = {};
    Servers.observer = Servers.find({})
    .populate('nodes')
    .populate('defaultNode')
    .populate('nodeInstances')
    .observeDeepChanges({
        // eslint-disable-next-line no-unused-vars
            added(id,model){
                assocModels[id] = model;
            },
        // eslint-disable-next-line no-unused-vars
            changed(id,fields,model){
                assocModels[id] = model;
            },
        // eslint-disable-next-line no-unused-vars
            removed(id,doc){
                delete assocModels[id];
            },
        },{
            pollingIntervalMs:100000,
            pollingThrottleMs:100
        }
    );
    await Servers.observer.models();

    Object.defineProperty(Servers, 'models', {
        enumerable: false,
        get:function(){
            return _.values(assocModels);
        }
    });

    Object.defineProperty(Servers, 'current', {
        enumerable: false,
        get:function(){
            let result = _.chain( assocModels )
            .values()
            .find((model)=>{
                return model.name == process.env.SERVER_NAME;
            })
            .value();
            return result;
        }
    });

    Object.defineProperty(Servers, 'node', {
        enumerable: false,
        get:function(){
            return  _.find(Servers.current?.nodes,(node)=>{
                return node.name === process.env.NODE_NAME;
            })
        }
    });

    if(Servers.current&&Servers.node){
        let nodeInstance = await NodeInstances.findOne({server_id:Servers.current._id,node_id:Servers.node._id});
        if(!nodeInstance){
            await new NodeInstances({
                server_id:Servers.current._id,
                node_id:Servers.node._id
            }).save();
        }
    }

    Object.defineProperty(Servers, 'nodeInstance', {
        enumerable: false,
        get:function(){
            let node = Servers.node;
            if(!node)
                return null;
            let nodeInstance = _.find ( Servers.current?.nodeInstances , (nodeInstance)=>{
                return nodeInstance.node_id == node.id;
            });
            return nodeInstance;
        }
    });

    Object.defineProperty(Servers, 'nodeName', {
        enumerable: false,
        get:function(){
            return process.env.NODE_NAME;
        }
    });

    defaultLogger
    .builder()
    .withLevel(LogLevels.info.key)
    .withMessage(`Запуск сервера ${Servers.current?.name||'<Не известно>'} нода: ${Servers.node?.name||'<Не известно>'} инстанс:${Servers.nodeInstance?.base_url||'<Не известно>'}`)
    .withData({})
    .withTag(Tags.system.key)
    .log()

}

export {
    load
}