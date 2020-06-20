import {abilityCondition,ability} from "../../../modules/acl2";
import _ from 'underscore';

export default function mongooseSandbox(schema, options){
    schema.pre('find',async function(){
        let options = this.getOptions();
        if(options && options.ctx){
            let aclCondition = await abilityCondition(this.model,['list'],options.ctx);
            if(!_.isEmpty(aclCondition)){
                this.where(aclCondition);
            }
        }
    });

    schema.pre('findOne',async function(){
        let options = this.getOptions();
        if(options && options.ctx){
            let aclCondition = await abilityCondition(this.model,['view'],options.ctx);
            if(!_.isEmpty(aclCondition)){
                this.where(aclCondition);
            }
        }
    });

    schema.pre('deleteMany',async function(){
        let options = this.getOptions();
        if(options && options.ctx){
            let aclCondition = await abilityCondition(this.model,['remove'],options.ctx);
            if(aclCondition){
                this.where(aclCondition);
            }
        }
    });

}