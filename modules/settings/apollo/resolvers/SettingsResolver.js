import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import Settings from "../../models/Settings";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class SettingsResolver extends CrudResolver2{
    constructor(){
        super(Settings)
    }
    populate (query) {
        return query;
    }    
}