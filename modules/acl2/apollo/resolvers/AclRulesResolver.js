import {
    methods,
    mutations,
    pagination,
    ability3
} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import AclRules from "../../models/AclRules";
import _ from 'underscore';
import descriptions from "./descriptions";
import AclFilters from "../../models/AclFilters";
import {VMRunner,VMRunnerContext} from 'vmrunner';
import operatorsForType from "/client/vue-form-generator/querybuilder/operatorsForType";
import {FIELD_BUILDER_TYPE} from "../../../../lib/enums";

const userVariables = {
    [FIELD_BUILDER_TYPE.string.key]:[
        {name:'user._id',label:'ID аккаунта'},
        {name:'user.login',label:'Логин аккаунта'},
        {name:'user.email',label:'Email аккаунта'},
        {name:'user.roleName',label:'Роль аккаунта'},
        {name:'user.currentUserId',label:'ID субаккаунта'}
    ],
    [FIELD_BUILDER_TYPE.double.key]:[],
    [FIELD_BUILDER_TYPE.integer.key]:[]
};

export default
@methods(['list','view','actions','filters'])
@mutations(['edit','create','remove'])
class AclRulesResolver extends CrudResolver2{
    constructor(){
        super(AclRules)
    }

    populate (query) {
        return query;
    }



    @pagination
    @ability3('all',null)
    async actions(obj,args,ctx){
        let resources = args.resources;
        if(_.isEmpty(resources)){
            resources = _.keys(descriptions.resources);
        }
        let actionsArr = _.chain(resources)
        .map((resource)=>{
            return descriptions.resources[resource];
        })
        .filter((actions)=>{
            return !_.isEmpty(actions);
        })
        .map((actions)=>{
            return _.map(actions,(action)=>{
                if(_.isString(action))
                    return action;
                return action.name;
            });
        })
        .value();

        let actNames = _.chain(actionsArr).flatten().unique().value();  //_.intersection.apply(_,actionsArr);
        let result = _.chain(actNames)
        .map((actionName)=>{
            let actionLabel = null;
            _.each(resources,(resource)=>{
                let actions = descriptions.resources[resource];
                if(!actionLabel&&actions){
                    let actData = _.find(actions,(tmpActData)=>{
                        return !_.isString(tmpActData)&&tmpActData.label
                    });
                    if(actData)
                        actionLabel = actData.label;
                }
            });
            actionLabel = actionLabel||descriptions.actionLabels[actionName]||actionName;
            return {
                name:actionName,
                label:actionLabel
            }
        })
        .value();
        return result;
    }

    @ability3('all',null)
    async filters(obj,args,ctx){
        let resources = args.resources;
        if(_.isEmpty(resources)){
            resources = _.keys(descriptions.resources);
        }

        return  AclFilters.find({
            modelNames:{$in:resources}
        }).then((aclFilters)=>{
            aclFilters = _.filter(aclFilters,(aclFilter)=>{
                return _.difference(resources,aclFilter.modelNames).length===0;
            });
            let filters = Promise.all(_.map(aclFilters,/**@param {AclFilters} aclFilter*/async (aclFilter)=>{
                const scope = new VMRunnerContext()
                .withScopeObj({})
                .withWrapScope(false);

                const vmRunner = new VMRunner(scope)
                .withThrow(false)
                .withConvertResult(true);

                let field = await vmRunner.run(aclFilter.mongoPathExpression,{});
                let label = await vmRunner.run(aclFilter.labelExpression,{});
                return {
                    id: aclFilter._id,
                    field:field,
                    label: label,
                    type: aclFilter.fieldType,
                    operators:operatorsForType(aclFilter.fieldType),
                    variables:userVariables[aclFilter.fieldType]||[]
                }
            }));
            return filters;
        });
    }
}