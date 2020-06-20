import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import FoodOffers from "../../models/FoodOffers";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class FoodOffersResolver extends CrudResolver2{
    constructor(){
        super(FoodOffers)
    }
    populate (query) {
        return query.populate('foodSource');
    }    
}