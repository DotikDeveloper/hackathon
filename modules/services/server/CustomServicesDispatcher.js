import {CustomServiceStates} from "../enums";
import appPromise from '/server/load/entrypoint';
import CustomServiceInstances from "../models/CustomServiceInstances";
import Servers from "../../cluster/models/Servers";

export default class CustomServicesDispatcher {
    constructor () {
        this.services = {};
    }

    /**@returns {CustomServicesDispatcher}*/
    static getInstance(){
        if(!CustomServicesDispatcher.instance){
            CustomServicesDispatcher.instance = new CustomServicesDispatcher();
        }
        return CustomServicesDispatcher.instance;
    }

    /**
     * @param {CustomServices} service
     * @returns {AbstractService}
     * */
    getService(service){
        return this.services[service.id];
    }

    /**
     * @param {CustomServices} service
     * @returns {AbstractService}
     * */
    async addService(service){
        const app = await appPromise;
        /**@type {AbstractService}*/
        let oldService = this.services[service.id];

        if( oldService && oldService.state === CustomServiceStates.RUNNING.key ){
            await oldService.stop();
        }

        let serviceClass = await service.runExpression( service.classExpr ,{},{useCache:true});

        let server_id = Servers.current?.id || null;
        let node_id = Servers.node?.id || null;

        let instance = await CustomServiceInstances.findOne({
            custom_service_id:service.id,
            server_id,
            node_id
        });
        if(!instance){
            instance = await new CustomServiceInstances({
                custom_service_id:service.id,
                server_id,
                node_id,
                meta:{}
            }).save()
        }
        /**@type {AbstractService}*/
        let newService = new serviceClass(app,instance);
        this.services[service.id] = newService;
        return this.services[service.id];
    }

    /**
     * @param {CustomServices} service
     * @returns {AbstractService}
     * */
    async stopService(service){
        /**@type {AbstractService}*/
        let oldService = this.services[service.id];
        if(oldService && oldService.state === CustomServiceStates.RUNNING.key){
            await oldService.stop();
        }
        delete this.services[service.id];
        return oldService;
    }
}