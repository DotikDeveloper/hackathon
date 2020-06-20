import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import MenuTypes from "../../models/MenuTypes";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class MenuTypesResolver extends CrudResolver2{
    constructor(){
        super(MenuTypes)
    }
    populate (query) {
        return query.populate('user').populate('imageFile').populate({
            path:'menuBlocks',
            populate:[{
                path:'imageFile'
            }]
        });
    }    
}