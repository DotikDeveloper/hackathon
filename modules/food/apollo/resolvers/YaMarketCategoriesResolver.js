import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import YaMarketCategories from "../../models/YaMarketCategories";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class YaMarketCategoriesResolver extends CrudResolver2{
    constructor(){
        super(YaMarketCategories)
    }
    populate (query) {
        return query.populate('foodCategory');
    }    
}