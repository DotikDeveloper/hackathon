import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import VmCodes from "../../models/VmCodes";
import {defaultScope} from "../../index";
import {VMRunner,VMRunnerContext} from 'vmrunner';
import _ from 'underscore';

export default
@methods(['list','view','validate','run'])
@mutations(['create','edit','remove'])
class VmCodesResolver extends CrudResolver2{
    constructor(){
        super(VmCodes)
    }
    populate (query) {
        return query;
    }

    @ability('run')
    async run(parent,args,{user},info){
        let condition = {_id:args._id};
        /**@type {VmCodes}*/
        let model = await this.model.findOne(condition);
        if(!model){
            model = new this.model();
            _.each(args.model,(val,key)=>{
                model[key] = val;
            });
        }

        try {
            let runner = new VMRunner (defaultScope)
            .withThrow (true)
            .withConvertResult (false);

            if (model.useCustomScope) {
                let scopeObj = await runner.run (model.scopeExpression);
                const runnerScope = new VMRunnerContext ()
                .withScopeObj (scopeObj)
                .withWrapScope (false);
                runner.withScopeCtx (runnerScope);
            }

            let runCtx = {};
            if (model.useCustomCtx) {
                runCtx = await runner.run (model.ctxExpression);
            }
            let started = Date.now();
            let result = await runner.run (model.expression, runCtx);
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