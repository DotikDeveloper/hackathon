import Servers from "/modules/cluster/models/Servers";
import EJSON from 'ejson';
import {Tags} from "../enums";

export default class LogsBuilder{
    constructor (logger) {
        this.logger = logger;
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            http: 3,
            verbose: 4,
            debug: 5,
            silly: 6
        };
        this.meta = {};

        this.withLevel('silly')
        .withMessage(null)
        .withTag(Tags.system.key)
        .withData(null)
        .withCreated(new Date())
        .withServer(Servers.current)
        .withNode(Servers.nodeName)
    }
    /**@returns {this}*/
    withLevel(level){
        if(this.levels[level]===undefined){
            throw new Error(`Unknown logger level "${level}"`)
        }
        this.level = level;
        return this;
    }

    /**@returns {this}*/
    withMessage(message){
        this.message = message;
        return this;
    }

    /**@returns {this}*/
    withError(err){
        if(err&&err.stack){
            this.withData({
                error:err.message,
                stack:err.stack
            });
            if(!this.message){
                this.withMessage(err.message)
            }
        }else{
            this.withData({
                error:String(err)
            });
            if(!this.message) {
                this.withMessage(String(err));
            }
        }
        return this;
    }

    /**@returns {this}*/
    withTag(tag){
        this.tag = tag;
        return this;
    }

    /**@returns {this}*/
    withData(data){
        if(this.data){
            Object.assign(this.data,data)
        }else
            this.data = data;
        return this;
    }

    /**@returns {this}*/
    withCreated(created){
        this.created = created||new Date();
        return this;
    }

    /**@returns {this}*/
    withUser(user){
        let user_id = user?user._id:null;
        return this.withUserId(user_id);
    }

    /**@returns {this}*/
    withUserId(user_id){
        this.meta.user_id = user_id;
        return this;
    }

    /**@returns {this} @param {Servers} server*/
    withServer(server){
        let server_id = server?server._id:null;
        return this.withServerId(server_id);
    }

    /**@returns {this}*/
    withServerId(server_id){
        this.meta.server_id = server_id;
        return this;
    }

    /**@returns {this}*/
    withNode(node){
        this.meta.node = node||null;
        return this;
    }

    async log(){
        let log = {
            level:this.level,
            message:this.message,
            tag:this.tag,
            dataString:EJSON.stringify(this.data),
            created:this.created,
            meta:this.meta
        };
        await this.logger.waitReady();
        return this.logger.log(log);
    }

}