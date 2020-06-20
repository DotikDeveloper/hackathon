import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import MenuBlocks from "../../models/MenuBlocks";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class MenuBlocksResolver extends CrudResolver2{
    constructor(){
        super(MenuBlocks)
    }
    populate (query) {
        return query.populate('user').populate('imageFile').populate({
            path:'menuTypes',
            populate:[{path:'imageFile'}]
        });
    }    
}