import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import CustomRoutes from "../../models/CustomRoutes";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class CustomRoutesResolver extends CrudResolver2{
    constructor(){
        super(CustomRoutes)
    }
    populate (query) {
        return query.populate('user');
    }    
}