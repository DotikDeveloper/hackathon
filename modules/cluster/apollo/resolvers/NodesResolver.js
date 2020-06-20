import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import Nodes from "../../models/Nodes";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class NodesResolver extends CrudResolver2{
    constructor(){
        super(Nodes)
    }
    populate (query) {
        return query.populate('servers');
    }    
}