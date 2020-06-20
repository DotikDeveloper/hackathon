/**
 error: 0,
 warn: 1,
 info: 2,
 http: 3,
 verbose: 4,
 debug: 5,
 silly: 6
 * */

import LoggerTags from "../models/LoggerTags";
import winston from "winston";
import MongooseTransport from "./MongooseTransport";
import _ from 'underscore';
import LogsBuilder from "./LogsBuilder";
import {Tags} from "../enums";
import ConsoleTransport from "./ConsoleTransport";

export default
class DefaultLogger{
    constructor () {
        this.loggers = _.chain(Tags.keys)
        .map((tag)=>{
            let transports = {
                console:new ConsoleTransport({
                    stderrLevels: ['error'],
                    consoleWarnLevels:['warn']
                }),
                mongo: new MongooseTransport()
            };
            return {
                tag:tag,
                transports,
                logger:winston.createLogger({
                    level: 'silly',
                    format: winston.format.json(),
                    //defaultMeta: { service: 'user-service' },
                    transports: _.values(transports)
                })
            }
        })
        .indexBy('tag')
        .value();

        this.tagsObserver = LoggerTags.find({}).observeChanges({
                /**@param {LoggerTags} model*/
                added:(id,model)=>{
                    let tag = model.name;
                    _.each(model.levels,(level,transportName)=>{
                         let loggerData = this.loggers[tag];
                         if(loggerData){
                             let transport = loggerData.transports[transportName];
                             if(transport) {
                                 transport.level = level;
                             }
                         }
                    });
                },
                /**@param {LoggerTags} model*/
                changed:(id,fields,model)=>{
                    let tag = model.name;
                    _.each(model.levels,(level,transportName)=>{
                        let loggerData = this.loggers[tag];
                        if(loggerData){
                            let transport = loggerData.transports[transportName];
                            if(transport) {
                                transport.level = level;
                            }
                        }
                    });
                }
            },{
                pollingIntervalMs:300000,
                pollingThrottleMs:100
            }
        );
    }

    static getInstance(){
        if(!DefaultLogger.instance){
            DefaultLogger.instance = new DefaultLogger();
        }
    }

    async waitReady(){
        await this.tagsObserver.models();
    }

    /**@param {LoggerLogs} rawLog*/
    log(rawLog){
        let tag = rawLog.tag || Tags.system.key;
        let loggerData = this.loggers[tag];
        if(loggerData){
            let logger = loggerData.logger;
            logger.log(rawLog);
        }
    }

    /**@returns {LogsBuilder}*/
    builder(){
        return new LogsBuilder(this);
    }
}