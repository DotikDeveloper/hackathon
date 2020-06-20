import mongoose from 'mongoose';
import {abilityCondition} from "../../acl2";
import MongooseQueryWrapper from "./MongooseQueryWrapper";
const ObjectId = mongoose.Types.ObjectId;
import _ from 'underscore';
import MongooseDocWrapper from "./MongooseDocWrapper";

export default class MongooseModelWrapper {
    constructor (model,user) {
        const wrapper = {
            /**
             * @param filter «Object|ObjectId»
              @param {Object|String} projection «Object|String» optional fields to return, see Query.prototype.select()
              @param {Object} options optional see Query.prototype.setOptions()
             @param {Function} callback
             * */
            find(conditions,projection,options,callback){
                if (typeof conditions === 'function') {
                    callback = conditions;
                    conditions = {};
                    projection = null;
                    options = null;
                } else if (typeof projection === 'function') {
                    callback = projection;
                    projection = null;
                    options = null;
                } else if (typeof options === 'function') {
                    callback = options;
                    options = null;
                }
                let callbackWrapper = null;
                if(callback){
                    callbackWrapper = function(err,result){
                        let transformed = result;
                        if(!_.isEmpty(result)){
                            transformed = _.chain(result)
                            .map((doc)=>{
                                return new MongooseDocWrapper(doc,user);
                            })
                            .value();
                        }
                        return callback(err,transformed);
                    }
                }
                options = options||{};
                const ctx = Object.freeze({user:user});
                Object.defineProperty(options, 'ctx', {
                    enumerable: true,
                    configurable:false,
                    get:function(){
                        return ctx;
                    }
                });
                return model.find(conditions,projection,options,callbackWrapper);
            },

            findOne(conditions,projection,options,callback){
                if (typeof conditions === 'function') {
                    callback = conditions;
                    conditions = {};
                    projection = null;
                    options = null;
                } else if (typeof projection === 'function') {
                    callback = projection;
                    projection = null;
                    options = null;
                } else if (typeof options === 'function') {
                    callback = options;
                    options = null;
                }
                let callbackWrapper = null;
                if(callback){
                    callbackWrapper = function(err,doc){
                        let transformed = doc;
                        if(doc){
                            transformed = new MongooseDocWrapper(doc,user);
                        }
                        return callback(err,transformed);
                    }
                }
                options = options||{};
                const ctx = Object.freeze({user:user});
                Object.defineProperty(options, 'ctx', {
                    enumerable: false,
                    configurable:false,
                    get:function(){
                        return ctx;
                    }
                });
                return model.findOne(conditions,projection,options,callbackWrapper);
            },

            deleteMany(conditions,options,callback){
                if (typeof conditions === 'function') {
                    callback = conditions;
                    conditions = {};
                    options = null;
                } else if (typeof options === 'function') {
                    callback = options;
                    options = null;
                }
                options = options||{};
                const ctx = Object.freeze({user:user});
                Object.defineProperty(options, 'ctx', {
                    enumerable: true,
                    configurable:false,
                    get:function(){
                        return ctx;
                    }
                });
                return model.deleteMany(conditions,options,callback);
            }

        };
        let proxy = new Proxy(model,{
            get: function(target, property) {
                if(wrapper[property])
                    return wrapper[property];
                if(target.publicFields&&target.publicFields.indexOf(property)>-1)
                    return target[property];
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