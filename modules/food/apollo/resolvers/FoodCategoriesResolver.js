import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import FoodCategories from "../../models/FoodCategories";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class FoodCategoriesResolver extends CrudResolver2{
    constructor(){
        super(FoodCategories)
    }
    populate (query) {
        return query.populate('yaMarketCategories');
    }    
}