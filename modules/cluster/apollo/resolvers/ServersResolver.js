import Servers from "../../models/Servers";
import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import _ from 'underscore';
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";

export default
@methods(['list','view','nodeNames'])
@mutations(['edit','create'])
class ServersResolver extends CrudResolver2{
    constructor(){
        super(Servers)
    }

    populate(query){
        return query.populate('nodes').populate('defaultNode');
    }

    nodeNames(){
        return _.chain( Servers.schema.paths )
        .keys()
        .map((path)=>{
            let paths = path.split('.');
            if( _.size(paths)>1 && paths[0]==='nodes' ){
                return paths[1];
            }
        })
        .compact()
        .unique()
        .value();
    }

}