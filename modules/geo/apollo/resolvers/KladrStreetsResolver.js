import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import KladrStreets from "../../models/KladrStreets";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class KladrStreetsResolver extends CrudResolver2{
    constructor(){
        super(KladrStreets)
    }
    populate (query) {
        return query;
    }    
}