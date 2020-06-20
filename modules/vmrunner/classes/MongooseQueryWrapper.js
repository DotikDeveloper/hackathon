import _ from 'underscore';
import {abilityCondition} from "/modules/acl2";
import MongooseDocWrapper from "./MongooseDocWrapper";

export default class MongooseQueryWrapper {
    constructor (query,user) {
        let wrapper = {
            exec(op,cb){
                return query.exec(op,cb);
            },

            then(resolve, reject) {
                return query.exec().then(resolve, reject);
            }
        }

        let proxy = new Proxy(query,{
            get: function(target, property) {
                if(wrapper[property])
                    return wrapper[property];
                return undefined;
            },
            set: function (target, key, value) {
                wrapper[key]=value;
                return true;
            },
            getOwnPropertyDescriptor(target, name){
                return Object.getOwnPropertyDescriptor(wrapper, name);
            },
            ownKeys(target){
                return Object.getOwnPropertyNames(target);
            },
            defineProperty(target, name, propertyDescriptor){
                return Object.defineProperty(wrapper,name,propertyDescriptor);
            },
            deleteProperty(target, name){
                return delete wrapper[name];
            },
            preventExtensions(){
                return Object.preventExtensions(wrapper);
            },
            has(target, name){
                return name in target;
            }
        });
        return proxy;
    }
}