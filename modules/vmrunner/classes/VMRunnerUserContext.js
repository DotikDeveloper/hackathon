import {VMRunnerContext} from "vmrunner";

import Users from "../../account/Users";
import MongooseModelWrapper from "./MongooseModelWrapper";
import MenuItems from "/modules/menu/models/MenuItems";
import MongooseDocWrapper from "./MongooseDocWrapper";
import EjsonAble from "../../../server/lib/EjsonAble";
import Servers from "../../cluster/models/Servers";
import Nodes from "../../cluster/models/Nodes";
import NodeInstances from "../../cluster/models/NodeInstances";
import stdScopeFactory from "./stdScopeFactory";
import Menus from "/modules/menu/models/Menus";
import MenuBlocks from "/modules/menu/models/MenuBlocks";
import MenuTypes from "/modules/menu/models/MenuTypes";
import MenuDispatcher from "../../menu/classes/MenuDispatcher";
import MenuBlockRunner from "../../menu/classes/MenuBlockRunner";
import MenuSessions from "../../menu/models/MenuSessions";
import DefaultMenuContext from "../../menu/classes/DefaultMenuContext";
import InMemoryMenuSession from "../../menu/classes/InMemoryMenuSession";
import GeneratorTemplates from "../../generator/models/GeneratorTemplates";
import KladrStreets from "../../geo/models/KladrStreets";
import FoodCategories from "../../food/models/FoodCategories";
import FoodOffers from "../../food/models/FoodOffers";
import FoodSources from "../../food/models/FoodSources";
import FoodSourceTypes from "../../food/models/FoodSourceTypes";
import GeoContext from "/modules/geo/classes/GeoContext";
import AbstractService from "../../services/classes/AbstractService";

import {variables} from "../../menu/classes/decorators";
import {VAR_TYPES} from "../../menu/enums";
import NodeCache from 'node-cache';
import {defaultLogger, LogLevels, Tags} from "../../logger";

import AclFilters from "../../acl2/models/AclFilters";
import AclRoles from "../../acl2/models/AclRoles";
import AclRules from "../../acl2/models/AclRules";
import CustomServices from "../../services/models/CustomServices";
import ImageFiles from "../../files/ImageFiles";

import NavItems from "../../custom/models/NavItems";
import CustomRoutes from "../../custom/models/CustomRoutes";
import DbfTransform from "../../import/fs/DbfTransform";
import BufferedStream from "../../../server/lib/BufferedStream";
import YaGeoCoder from "../../geo/classes/YaGeoCoder";
import CsvTransform from "../../import/fs/CsvTransform";
import YaMarketCategories from '/modules/food/models/YaMarketCategories';

import _ from 'underscore';
const scopeCache = new NodeCache({
    stdTTL:5*60,
    checkperiod:60,
    useClones:false,
    deleteOnExpire:true
});
import appPromise from '/server/load/entrypoint';
import forUser from "../forUser";


import {MongoClient} from 'mongodb';


export default class VMRunnerUserContext extends VMRunnerContext{
    constructor (user) {
        super ();
        this.withScopeObj({
            _,
            EjsonAble,
            AclFilters:new MongooseModelWrapper(AclFilters,user),
            AclRoles:new MongooseModelWrapper(AclRoles,user),
            AclRules:new MongooseModelWrapper(AclRules,user),
            CustomServices:new MongooseModelWrapper(CustomServices,user),
            ImageFiles:new MongooseModelWrapper(ImageFiles,user),

            Users:new MongooseModelWrapper(Users,user),

            MenuItems:new MongooseModelWrapper(MenuItems,user),
            Menus:new MongooseModelWrapper(Menus,user),
            MenuBlocks:new MongooseModelWrapper(MenuBlocks,user),
            MenuTypes:new MongooseModelWrapper(MenuTypes,user),
            MenuSessions:new MongooseModelWrapper(MenuSessions,user),
            KladrStreets:new MongooseModelWrapper(KladrStreets,user),
            YaMarketCategories:new MongooseModelWrapper(YaMarketCategories,user),
            FoodCategories:new MongooseModelWrapper(FoodCategories,user),
            FoodOffers:new MongooseModelWrapper(FoodOffers,user),
            FoodSources:new MongooseModelWrapper(FoodSources,user),
            FoodSourceTypes:new MongooseModelWrapper(FoodSourceTypes,user),
            InMemoryMenuSession,

            DbfTransform,
            BufferedStream,
            CsvTransform,

            YaGeoCoder,
            GeoContext,
            Servers:new MongooseModelWrapper(Servers,user),
            Nodes:new MongooseModelWrapper(Nodes,user),
            NodeInstances:new MongooseModelWrapper(NodeInstances,user),

            NavItems:new MongooseModelWrapper(NavItems,user),
            CustomRoutes:new MongooseModelWrapper(CustomRoutes,user),

            GeneratorTemplates:new MongooseModelWrapper( GeneratorTemplates , user ),

            user:new MongooseDocWrapper(user,user),

            //menu
            DefaultMenuContext: DefaultMenuContext,
            variables,
            VAR_TYPES,
            MenuDispatcher: MenuDispatcher,MenuBlockRunner,
            clearUserCache(){
                scopeCache.del( user.id );
            },
            ...stdScopeFactory(),

            AbstractService,
            defaultLogger,
            appPromise,

        });

        Object.defineProperty(this.scopeObj,'vmRunner',{
            enumerable: false,
            configurable:false,
            get(){
                return forUser(user)
            }
        })
    }

    static forUser(user){
        if(!user)
            return null;
        let context = scopeCache.get( user.id );
        if(context)
            return context;
        context = new VMRunnerUserContext(user);
        scopeCache.set( user.id, context );
        return context;
    }

}