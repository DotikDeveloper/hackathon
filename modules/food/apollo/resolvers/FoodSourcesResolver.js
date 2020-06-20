import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import FoodSources from "../../models/FoodSources";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class FoodSourcesResolver extends CrudResolver2{
    constructor(){
        super(FoodSources)
    }
    populate (query) {
        return query.populate('foodSourceType');
    }    
}