import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import NodeInstances from "../../models/NodeInstances";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class NodeInstancesResolver extends CrudResolver2{
    constructor(){
        super(NodeInstances)
    }
    populate (query) {
        return query.populate('server').populate('node');
    }    
}