import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import MenuItems from "../../models/MenuItems";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class MenuItemsResolver extends CrudResolver2{
    constructor(){
        super(MenuItems)
    }
    populate (query) {
        return query.populate('menu').populate('user').populate('menuBlock');
    }    
}