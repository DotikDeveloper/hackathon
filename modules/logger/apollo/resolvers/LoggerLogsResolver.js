import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import LoggerLogs from "../../models/LoggerLogs";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class LoggerLogsResolver extends CrudResolver2{
    constructor(){
        super(LoggerLogs)
    }
    populate (query) {
        return query;
    }    
}