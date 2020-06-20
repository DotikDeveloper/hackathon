import DefaultLogger from "./classes/DefaultLogger";
import {LogLevels, Tags} from "./enums";
import './utils/autofill';
import Servers from "../cluster/models/Servers";
const defaultLogger = new DefaultLogger();
/*
(async ()=>{
    let server = Servers.current;
    defaultLogger
        .builder()
        .withLevel(LogLevels.info.key)
        .withMessage(`Запуск сервера ${server?server.name:'<Не известно>'} нода:${Servers.node?Servers.node.base_url:'<Не известно>'}`)
        .withData({})
        .withTag(Tags.system.key)
        .log()
}).apply();
*/
export {
    defaultLogger,LogLevels,Tags
}