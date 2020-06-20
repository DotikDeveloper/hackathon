import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import CustomServiceInstances from "../../models/CustomServiceInstances";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class CustomServiceInstancesResolver extends CrudResolver2{
    constructor(){
        super(CustomServiceInstances)
    }
    populate (query) {
        return query.populate('server').populate('node').populate('customService');
    }    
}