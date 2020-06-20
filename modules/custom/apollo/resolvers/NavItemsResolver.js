import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import NavItems from "../../models/NavItems";
import forUser from "/modules/vmrunner/forUser";
import customQueryParse from "../../../../server/lib/customQueryParse";
import sift from 'sift';

export default
@methods(['list','view','validate','treeData'])
@mutations(['create','edit','remove'])
class NavItemsResolver extends CrudResolver2{
    constructor(){
        super(NavItems)
    }
    populate (query) {
        return query.populate('parentItem').populate('user');
    }

    async treeData(parent,args,ctx,info){
        return await NavItems.generateTreeData(ctx.user);
    }

}