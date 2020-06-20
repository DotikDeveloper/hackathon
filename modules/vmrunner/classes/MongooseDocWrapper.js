import {ability as acl2Ability} from "../../acl2";
import _ from 'underscore';

export default class MongooseDocWrapper{
    constructor (doc,user){
        let original = doc.toObject({ getters: true });
        let proxy;
        let wrapper = {
            async save(){
                let isNew = !original._id;
                let actions = [isNew ? 'create':'edit'];
                if(isNew){
                    let allowed = await acl2Ability (doc, actions, {
                        user,
                        model:doc
                    });
                    if (!allowed) {
                        throw new Error('Not allowed');
                    } else {
                        return doc.save.apply(doc, arguments);
                    }
                }else{
                    let model = await doc.constructor.findOne({_id:original._id});
                    let allowed = await acl2Ability (model, actions, {user,model});
                    if(allowed){
                        allowed = await acl2Ability (doc, actions, { user,doc });
                    }
                    if (!allowed) {
                        throw new Error('Not allowed');
                    } else {
                        return doc.save.apply(doc, arguments);
                    }
                }
            },
            toJSON(options){
                return doc.toJSON(options);
            },
            toObject(options){
                return doc.toObject(options);
            }
        };
        proxy = new Proxy(doc,{
            get: function(target, property) {
                if(wrapper[property])
                    return wrapper[property];
                if(property===Symbol.toStringTag){
                    return wrapper.toObject();
                }
                return doc.get(property);
            },
            set: function (target, key, value) {
                doc.set(key,value);
                return true;
            },
            getOwnPropertyDescriptor(target, name){
                return Object.getOwnPropertyDescriptor(doc, name);
            },
            ownKeys(target){
                return Object.getOwnPropertyNames(doc);
            },
            defineProperty(target, name, propertyDescriptor){
                return Object.defineProperty(wrapper,name,propertyDescriptor);
            },
            deleteProperty(target, name){
                return delete doc[name];
            },
            preventExtensions(){
                return Object.preventExtensions(doc);
            },
            has(target, name){
                return name in doc;
            }
        });
        return proxy;
    }
}