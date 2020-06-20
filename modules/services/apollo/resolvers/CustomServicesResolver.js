import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import CustomServices from "../../models/CustomServices";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class CustomServicesResolver extends CrudResolver2{
    constructor(){
        super(CustomServices)
    }
    populate (query) {
        return query.populate('user').populate('imageFile');
    }    
}