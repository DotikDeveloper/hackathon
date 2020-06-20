import {ability3 as ability, methods, mutations} from "/server/apollo/module";
import CrudResolver2 from "/server/apollo/resolvers/CrudResolver2";
import VMTemplates from "../../models/VMTemplates";
import _ from 'underscore';
import {defaultScope} from "/modules/vmrunner/index";
import {VMRunner,VMRunnerContext} from 'vmrunner';
import VMRunnerUserContext from "../../classes/VMRunnerUserContext";
import Users from "../../../account/Users";
defaultScope.scopeObj.require = require;//TODO
export default
@methods(['list','view','validate','run'])
@mutations(['create','edit','remove'])
class VMTemplatesResolver extends CrudResolver2{
    constructor(){
        super(VMTemplates)
    }
    populate (query) {
        return query.populate('user').populate('server');
    }

    get typeName(){
        return 'VMTemplates';
    }

    @ability('run')
    async run(parent,args,ctx,info){
        if(!args.model._id)
            throw new Error('Not found');
        let condition = {_id:args.model._id};
        /**@type {VMTemplates}*/
        let model = await this.model.findOne(condition).populate('user');
        let user = null;
        if(!model){
            model = new this.model();
            _.each(args.model,(val,key)=>{
                model[key] = val;
            });
            user = await Users.findOne(model.user_id);
        }else
            user = model.user;
        if(!user)
            throw new Error('Not found');
        try {
            let runner = new VMRunner (new VMRunnerUserContext(user))
            .withThrow (true)
            .withConvertResult (false);

            if (args.model.useCustomScope) {
                let scopeObj = await runner.run (args.model.scopeExpression);
                const runnerScope = new VMRunnerUserContext(user)
                .withScopeObj (scopeObj)
                .withWrapScope (false);
                runner.withScopeCtx (runnerScope);
            }

            let runCtx = {};
            if (args.model.useCustomCtx) {
                runCtx = await runner.run (args.model.ctxExpression);
            }
            let started = Date.now();
            let result = await runner.run (args.model.expression, runCtx);
            if(result===undefined){
                result = '<undefined>';
            }
            return {
                delay:Date.now()-started,
                result:{result}
            }
        }catch (e) {
            return {
                error:String(e),
                stack:String(e.stack),
                result:undefined
            }
        }
    }
}