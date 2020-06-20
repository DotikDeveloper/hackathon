import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import LoggerGlobalLogs from "../../models/LoggerGlobalLogs";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class LoggerGlobalLogsResolver extends CrudResolver2{
    constructor(){
        super(LoggerGlobalLogs)
    }
    populate (query) {
        return query;
    }    
}