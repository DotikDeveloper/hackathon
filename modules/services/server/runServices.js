import CustomServices from "../models/CustomServices";
import Servers from "../../cluster/models/Servers";
import MongoBuilder from "../../../lib/MongoBuilder";
import sift from 'sift';
import CustomServicesDispatcher from "./CustomServicesDispatcher";
import {defaultLogger, LogLevels, Tags} from "../../logger";
import CustomServiceInstances from "../models/CustomServiceInstances";
import {CustomServiceStates} from "../enums";

let server_id = Servers.current?.id || null;
let node_id = Servers.node?.id || null;

async function check (model) {
    let condition = await new MongoBuilder ().getMongo (model.rules, new Date ());
    let siftQuery = sift (condition);
    let ctx = {
        server_id,
        node_id
    };
    let result = siftQuery (ctx);
    console.log(JSON.stringify(condition),result);
    return result;
}

CustomServices.find ({autostart: true}).observeChanges ({
    async added(id){
        /**@type {CustomServices}*/
        let model = await CustomServices.findOne ({_id: id});
        /**@type {AbstractService}*/
        let service = null;
        if (await check (model)) {
            try {
                service = await CustomServicesDispatcher.getInstance ().addService (model);
                await service.start ();
            } catch (err) {
                if(service){
                    await service.onError(err);
                }
            }
        }
    },
    async changed (id) {
        let model = await CustomServices.findOne ({_id: id});
        /**@type {AbstractService}*/
        let service;
        try {
            if (await check (model)) {
                service = await CustomServicesDispatcher.getInstance ().addService (model);
                await service.start ();
            } else {
                CustomServicesDispatcher.getInstance ().stopService (model);
            }
        } catch (err) {
            if(service){
                await service.onError(err);
            }
        }
    },
    async removed (id, model) {
        /**@type {AbstractService}*/
        let service = null;
        try {
            service = CustomServicesDispatcher.getInstance().getService(model);
            await CustomServicesDispatcher.getInstance ().stopService (model);
        } catch (err) {
            if(service){
                await service.onError(err);
            }
        }
    }
},{
    pollingIntervalMs:300*1000,
    pollingThrottleMs:1000
});