import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import LoggerTags from "../../models/LoggerTags";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class LoggerTagsResolver extends CrudResolver2{
    constructor(){
        super(LoggerTags)
    }
    populate (query) {
        return query;
    }    
}