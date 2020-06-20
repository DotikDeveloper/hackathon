import AclRules from "./models/AclRules";
import {VMRunner,VMRunnerContext} from 'vmrunner';
import customQueryParse from "../../server/lib/customQueryParse";
import async from 'async';
import _ from 'underscore';
import sift from 'sift';
import {RULE_MODE} from "./enums";
import forUser from "/modules/vmrunner/forUser";
/**
 * @name AclCtx
 * @property {Users} user
 * @property {Model} model
 * @property {Object} modifier
 **/

async function abilityCondition(model,actions,ctx){
    let modelName = _.isString(model)? model : model.collection.name;
    if(!_.isArray(actions)){
        actions = [actions];
    }
    return new Promise((resolve,reject)=>{
        AclRules.find({
            roles:{$in:[ctx.user.roleName]},
            resources:{$in:[modelName]},
            actions:{$in:actions}
        }).populate('user').then((aclRules)=>{
            if(_.isEmpty(aclRules))
                return resolve(false);
            async.mapLimit(aclRules, 1, /**@param {AclRules} aclRule*/ function(aclRule,cb){
                if(!aclRule.user){
                    return cb(null,{});
                }
                switch (aclRule.mode) {
                    case RULE_MODE.allow_all.key:
                        return cb(null,{});
                    case RULE_MODE.disallow_all.key:
                        return cb(null,{
                            $and:[
                                {_id:{$exists:false}},
                                {_id:{$exists:true}},
                            ]
                        });
                    case RULE_MODE.condition_expression.key:{
                        aclRule.runExpression( aclRule.conditionExpr , ctx ,{useCache:false}).then((condition)=>{
                            return cb(null,condition);
                        }).catch((err)=>{
                            cb(err);
                        });
                        break;
                    }
                    default: {
                        const vmRunner = forUser(aclRule.user);
                        customQueryParse (aclRule.rules, ctx, vmRunner).then ((condition) => {
                            cb (null, condition);
                        }).catch ((err) => {
                            cb (err);
                        });
                    }
                }
            },(err,conditions)=>{
                if(err)
                    return reject(err);
                conditions = _.filter(conditions,(condition)=>{
                    return _.size(condition)>0;
                });
                if(_.isEmpty(conditions)){
                    return resolve({});
                }
                if(_.size(conditions)===1){
                    return resolve(_.first(conditions));
                }else{
                    return resolve({
                        $and:conditions
                    });
                }
            });
        });
    });
}

async function ability (model,actions,ctx) {
    let modelName = model.collection.name;
    if(!_.isArray(actions)){
        actions = [actions];
    }

    return new Promise((resolve,reject)=>{
        AclRules.find({
            roles:{$in:[ctx.user.roleName]},
            resources:{$in:[modelName]},
            actions:{$in:actions}
        }).then((aclRules)=>{
            if(_.isEmpty(aclRules))
                return resolve(false);
            async.everyLimit(aclRules, 1, /**@param {AclRules} aclRule*/ function(aclRule,cb){
                switch (aclRule.mode) {
                    case RULE_MODE.allow_all.key:
                        return cb(null,true);
                    case RULE_MODE.disallow_all.key:
                        return cb(null,false);
                    default: {
                        const scope = new VMRunnerContext ()
                        .withScopeObj ({})
                        .withWrapScope (false);

                        const vmRunner = new VMRunner (scope)
                        .withThrow (true)
                        .withConvertResult (false);

                        customQueryParse (aclRule.rules, ctx, vmRunner).then ((condition) => {
                            console.log({condition:JSON.stringify(condition)});
                            let query = sift(condition);
                            let result = (query(model));
                            cb(null,result);
                        }).catch ((err) => {
                            cb (err);
                        });
                    }
                }
            },(err,result)=>{
                if(err)
                    return reject(err);
                resolve(result);
            });
        });
    });

}



export {
    abilityCondition,
    ability
}