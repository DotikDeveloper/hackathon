import {VMRunnerContext} from "vmrunner";
import {formatRuDate, formatRuDateTime} from "../../../lib/utils";
import {isset} from "../../../server/lib/utils";
import _ from 'underscore';
import {get as safeGet} from 'lodash';
import md5 from 'md5';
import HttpClient from "../../../server/lib/HttpClient";
import moment from 'moment';
import stdScopeFactory from "./stdScopeFactory";
import EjsonAble from "../../../server/lib/EjsonAble";
import MongooseModelWrapper from "./MongooseModelWrapper";
import Users from "../../account/Users";
import Servers from "../../cluster/models/Servers";
import Nodes from "../../cluster/models/Nodes";
import NodeInstances from "../../cluster/models/NodeInstances";
import MenuItems from "../../menu/models/MenuItems";
import MongooseDocWrapper from "./MongooseDocWrapper";
export default class VMRunnerSystemContext extends  VMRunnerContext{
    constructor () {
        super ();
        this.withScopeObj({
            ...stdScopeFactory(),
            EjsonAble,
            Users:Users,
            MenuItems,
            Servers,
            Nodes,
            NodeInstances,
        })
    }


}