import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import MenuSessions from "../../models/MenuSessions";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class MenuSessionsResolver extends CrudResolver2{
    constructor(){
        super(MenuSessions)
    }
    populate (query) {
        return query.populate('user').populate({
            path:'menu',
            populate:{
                path:'menuType',
                populate:{
                    path:'imageFile'
                }
            }
        });
    }    
}