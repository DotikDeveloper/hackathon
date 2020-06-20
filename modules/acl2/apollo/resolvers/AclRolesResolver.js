import AclRoles from "/modules/acl2/models/AclRoles";
import {
    ability3,
    methods,
    mutations, pagination
} from "/server/apollo/module";
import _ from 'underscore';
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import descriptions from "./descriptions";
import mongoose from 'mongoose';

export default @methods (['validate', 'list', 'view', 'resources', 'resourceFields'])
@mutations (['edit', 'create', 'remove'])
class AclRolesResolver extends CrudResolver2 {
    constructor () {
        super (AclRoles);
    }

    @ability3 ('all', null)
    async resources (obj, args, ctx) {
        let list = _.chain (mongoose.connections)
        .map ((connection) => {
            return _.values (connection.models);
        })
        .flatten ()
        .map ((model) => {
            return {
                name: model.modelName,
                label: model.label ? `${model.label} (${model.modelName})` : model.modelName
            }
        })
        .value ();
        return list;
    }

    @pagination
    @ability3 ('all', null)
    async resourceFields (obj, {resource}, ctx) {
        let models = _.chain (mongoose.connections)
        .map ((connection) => {
            return _.values (connection.models);
        })
        .flatten ()
        .value ();

        return _.chain (models)
        .map (model => {
            let props = _.keys (model.schema.tree);
            return _.chain (props)
            .filter ((prop) => {
                return prop !== '__v' && prop !== 'id';
            })
            .map ((prop) => {
                return {
                    name: prop, label: prop, resource: model.modelName
                }
            })
            .value ();
        })
        .flatten ()
        .sortBy ('name')
        .value ();

    }

}