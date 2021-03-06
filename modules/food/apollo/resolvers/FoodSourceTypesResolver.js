import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import FoodSourceTypes from "../../models/FoodSourceTypes";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class FoodSourceTypesResolver extends CrudResolver2{
    constructor(){
        super(FoodSourceTypes)
    }
    populate (query) {
        return query.populate('user').populate('image');
    }    
}