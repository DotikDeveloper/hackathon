import _ from "underscore";
//import traverse from 'traverse';
import {isMongooseDoc} from "../module";
import traverse from 'traverse';
export default class AbstractResolver{
    constructor(){

    }

    get methodNames(){
        if(this.constructor[this.constructor.name])
            return _.clone(this.constructor[this.constructor.name].methods);
        return [];
    }
    get mutationNames(){
        if(this.constructor[this.constructor.name])
            return _.clone(this.constructor[this.constructor.name].mutations);
        return [];
    }
    get subscriptionNames(){
        if(this.constructor[this.constructor.name])
            return _.clone(this.constructor[this.constructor.name].subscriptions);
        return [];
    }

    async transformResponse(response,user){
        if(!user||!response)
            return response;
        let promises = [];
        let context = {response};
        traverse(context).forEach(function(doc) {
            if(doc&&isMongooseDoc(doc)){
                let raw = doc.toObject({
                    virtuals:true,
                    user:user
                });
                if(doc.getAcl) {
                    promises.push((async ()=>{
                        raw.acl = await doc.getAcl (user);
                    })());
                }
                this.update(raw);
            }
        });
        await Promise.all(promises);
        //console.log(JSON.stringify(context.response));
        return context.response;
    }

    resolver(){
        const self = this;
        let resolver = {};
        _.each(this.methodNames,(methodName)=>{
            resolver[methodName] = async function(obj, args, context, info){
                try {
                    let result = await self[methodName].apply(self,[obj, args, context, info]);
                    return self.transformResponse(result,context.user);
                }catch (e) {
                    console.error(e);
                    throw e;
                }

            }
        });
        return resolver;
    }

    mutations(){
        const self = this;
        let resolver = {};
        _.each(this.mutationNames,(mutationName)=>{
            resolver[mutationName] = function(obj, args, context, info){
                return self[mutationName].apply(self,[obj, args, context, info]);
            }
        });
        return resolver;
    }

    subscriptions(){
        const self = this;
        let result = {};
        _.each(this.subscriptionNames,(subscriptionName)=>{
            result[subscriptionName] = {
                resolve (payload, args, context, info) {
                    return payload;
                },
                subscribe:function(){
                    return self[subscriptionName].apply(self,arguments);
                },
            }
        });
        return result;
    }
}