import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import _ from 'underscore';
import {RULE_MODE} from "../enums";
import {validate as codeValidate} from "../../vmrunner";
import vmPlugin from "../../../server/mPlugins/vmPlugin";
/**
 * @constructor AclRules
 * @property {string} name Имя
 * @property {string[]} roles Роли
 * @property {string[]} resources Ресурсы
 * @property {string[]}  actions Действия
 * @property {string} mode Режим
 * @property {object} rules Правила
 * @property {object} conditionExpr Код, возвращающий mongo selector
 * @property {string} user_id ID владельца
 * @property {Users} user Владелец
 **/
const AclRulesSchema = new Schema({
    name:{
        type:String,default(){
            return this.resources.join(', ');
        }
    },
    roles:{
        type:[String],
        required: true,
        validate(value){
            if(_.isEmpty(value)){
                throw new Error('Роли не могут быть пусты');
            }
        }
    },
    resources:{
        type:[String],
        required:true,
        validate(value){
            if(_.isEmpty(value)){
                throw new Error('Ресурсы не могут быть пусты');
            }
        }
    },
    actions:{
        type:[String],
        required:true,
        validate(value){
            if(_.isEmpty(value)){
                throw new Error('Действия не могут быть пусты');
            }
        }
    },
    mode:{
        type:String,
        enum:RULE_MODE.values(),
        default:_.first( RULE_MODE.values() )
    },
    rules:{},
    conditionExpr:{
        type:String,
        required(){
            return this.mode===RULE_MODE.condition_expression.key;
        },
        validate:function(expression){
            if(this.mode===RULE_MODE.condition_expression.key){
                return codeValidate(expression);
            }
        }
    },

    user_id:{
        type:String
    }
});

AclRulesSchema.idAclRulesSchema = true;

AclRulesSchema.plugin(vmPlugin);

AclRulesSchema.virtual ('user', {
    ref: 'users',
    localField: 'user_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

const AclRules = new mongoose.model('aclRules',AclRulesSchema,'aclRules');
export default AclRules;