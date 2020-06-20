import {
    methods,
    mutations, pagination
} from "../../../../server/apollo/module";
import mongoose from 'mongoose';
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import AclFilters from "../../models/AclFilters";
import _ from 'underscore';

export default

@methods(['list','view','resourceNames'])
@mutations(['edit','create','remove'])
class AclFiltersResolver extends CrudResolver2{
    constructor(){
        super(AclFilters)
    }

    populate (query) {
        return query;
    }

    @pagination
    async resourceNames(){
        let modelNames  = _.chain(mongoose.connections)
        .map((connection)=>{
            return _.values( connection.models );
        })
        .flatten()
        .map((model)=>{
            return {
                name:model.modelName,
                label:model.label?`${model.label} (${model.modelName})`:model.modelName
            }
        })
        .value();
        return [
            ...modelNames,{
                name:'npmModules',label:'NPM модули'
            },{
                name:'documentation',label:'Документация'
            }
        ]
    }


}