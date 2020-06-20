import {ApolloServer} from 'apollo-server-express';
import AclRolesResolver from "/modules/acl2/apollo/resolvers/AclRolesResolver";
import {FilesResolver} from "./resolvers/FilesResolver";
import schema from './schemas/main.graphql';
import UsersResolver from "../../modules/account/apollo/resolvers/UsersResolver";
import ServersResolver from "../../modules/cluster/apollo/resolvers/ServersResolver";
import TmpFilesResolver from "../../modules/tmpfiles/apollo/resolvers/TmpFilesResolver";
import AclFiltersResolver from "/modules/acl2/apollo/resolvers/AclFiltersResolver";
import AclRulesResolver from "/modules/acl2/apollo/resolvers/AclRulesResolver";
import LoggerTagsResolver from "/modules/logger/apollo/resolvers/LoggerTagsResolver";
import LoggerLogsResolver from "/modules/logger/apollo/resolvers/LoggerLogsResolver";
import {get} from 'lodash';
import Users from "/modules/account/Users";
import GeneratorTemplatesResolver from "/modules/generator/apollo/resolvers/GeneratorTemplatesResolver";
import GeneratorItemsResolver from "/modules/generator/apollo/resolvers/GeneratorItemsResolver";
import ApolloServerConfig from "./ApolloServerConfig";
import VmCodesResolver from "/modules/vmrunner/apollo/resolvers/VmCodesResolver";
import VMTemplatesResolver from "/modules/vmrunner/apollo/resolvers/VMTemplatesResolver";
import LoggerGlobalLogsResolver from "/modules/logger/apollo/resolvers/LoggerGlobalLogsResolver";
import MenuTypesResolver from "../../modules/menu/apollo/resolvers/MenuTypesResolver";
import MenuBlocksResolver from "../../modules/menu/apollo/resolvers/MenuBlocksResolver";
import MenusResolver from "../../modules/menu/apollo/resolvers/MenusResolver";
import MenuItemsResolver from "../../modules/menu/apollo/resolvers/MenuItemsResolver";
import ImageFilesResolver from "../../modules/files/apollo/resolvers/ImageFilesResolver";
import MenuSessionsResolver from "../../modules/menu/apollo/resolvers/MenuSessionsResolver";
import CustomServicesResolver from "../../modules/services/apollo/resolvers/CustomServicesResolver";
import CustomServiceInstancesResolver from "../../modules/services/apollo/resolvers/CustomServiceInstancesResolver";
import NodesResolver from "../../modules/cluster/apollo/resolvers/NodesResolver";
import NodeInstancesResolver from "../../modules/cluster/apollo/resolvers/NodeInstancesResolver";
import SettingsResolver from "../../modules/settings/apollo/resolvers/SettingsResolver";
import CustomRoutesResolver from "../../modules/custom/apollo/resolvers/CustomRoutesResolver";
import NavItemsResolver from "../../modules/custom/apollo/resolvers/NavItemsResolver";
import KladrStreetsResolver from "../../modules/geo/apollo/resolvers/KladrStreetsResolver";
import YaMarketCategoriesResolver from "../../modules/food/apollo/resolvers/YaMarketCategoriesResolver";
import FoodSourceTypesResolver from "../../modules/food/apollo/resolvers/FoodSourceTypesResolver";
import FoodSourcesResolver from "../../modules/food/apollo/resolvers/FoodSourcesResolver";
import FoodCategoriesResolver from "../../modules/food/apollo/resolvers/FoodCategoriesResolver";
import FoodOffersResolver from "../../modules/food/apollo/resolvers/FoodOffersResolver";
const apolloServerConfig = new ApolloServerConfig ()
.withContext (async ({req, connection}) => {
    req = connection ? connection.context.req : req;
    let ctx = connection ? connection.context : {};
    ctx.req = req;
    if (ctx.loaded)
        return ctx;
    return await new Promise (resolve => {
        let rawUser = get (req, 'session.user', null);
        if (!rawUser) {
            ctx.loaded = true;
            return resolve (ctx);
        }
        Users.findOne ({_id: rawUser._id}).populate ('currentUser').then ((user) => {
            ctx.user = user;
            if (!user) {
                ctx.loaded = true;
                return resolve (ctx);
            }
            ctx.loaded = true;
            resolve (ctx);
        });
    });
})
.withFormatError ((err) => {
    if (err.extensions.code == 'UNAUTHENTICATED') {
        return err.message;
    }
    if (err.message.startsWith ("Database Error: ")) {
        return new Error ('Internal server error');
    }
    return err;
})
.withTypeDefs (schema)
.withResolver (FilesResolver, 'files')
.withResolver (UsersResolver)
//cluster module
.withResolvers ([ServersResolver,NodesResolver,NodeInstancesResolver])
.withResolver (TmpFilesResolver)
//generator module
.withResolvers([GeneratorTemplatesResolver,GeneratorItemsResolver])
.withResolvers([AclRolesResolver,AclFiltersResolver,AclRulesResolver])
//vmrunner module
.withResolvers ([VmCodesResolver, VMTemplatesResolver])
//logger module
.withResolvers ([LoggerLogsResolver, LoggerTagsResolver, LoggerGlobalLogsResolver])
//menu module
.withResolvers([MenuTypesResolver,MenuBlocksResolver,MenusResolver,MenuItemsResolver,MenuSessionsResolver])
//files module
.withResolvers([ImageFilesResolver])
//services module
.withResolvers([CustomServicesResolver,CustomServiceInstancesResolver])
//settings module
.withResolvers([SettingsResolver])
//custom module
.withResolvers([CustomRoutesResolver,NavItemsResolver])
//geo module
.withResolvers([KladrStreetsResolver])
//food module
.withResolvers([YaMarketCategoriesResolver,FoodSourceTypesResolver,FoodSourcesResolver,FoodCategoriesResolver,FoodOffersResolver])

const newConfig = apolloServerConfig.build ();


let server = null;
try {
    server = new ApolloServer (newConfig);
} catch (e) {
    console.error (e);
}

export {server};


