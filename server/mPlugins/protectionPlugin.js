import AclDispatcher from "../../modules/acl2/classes/AclDispatcher";
import _ from 'underscore';
import dotProp from 'dot-prop';
import descriptions from "../../modules/acl2/apollo/resolvers/descriptions";
import mongoose from "mongoose";

_.each(mongoose.modelNames,(modelName)=>{
    console.warn(`no protection for ${modelName}`);
});

let ability;
let _defaultLogger = null;
function getDefaultLogger(){
    if(!_defaultLogger){
        _defaultLogger = require('/modules/logger').defaultLogger;
    }
    return _defaultLogger;
}

// eslint-disable-next-line no-unused-vars
export default function(schema,options={}){

    const dispatcher = AclDispatcher.getInstance();

    function transform(doc, ret, options){
        if(ret.__cached_attachments)
            delete ret.__cached_attachments;
        if(options&&options.user){
            if(dispatcher.isReady){
                try {
                    let privateFields = dispatcher.docPrivateFieldsSync(doc.$parent||doc,options.user);
                    if(!_.isEmpty(privateFields)){
                        _.each( privateFields, (privateField)=>{
                            dotProp.delete(ret,privateField);
                        });
                    }
                }catch (e) {
                    getDefaultLogger().builder()
                    .withError(e)
                    .withLevel('warn')
                    .withData({user_id:options.user.id})
                    .log();
                }
            }
            return ret;
        }
    }

    schema.set('toJSON', {
        transform
    });

    schema.set('toObject', {
        transform
    });

    schema.methods.getAcl =/**@param {Users} user*/ async function(user){
        if(!ability){
            ability = require('/modules/acl2').ability;
        }
        if(!user)
            return {};
        let actions = descriptions.resources[this.constructor.modelName]||[];
        if(_.isEmpty(actions))
            return {};
        let acl = {
            actions:{}
        };
        acl.protectedFields = dispatcher.docProtectedFieldsSync(this.$parent||this,user);
        acl.privateFields = dispatcher.docPrivateFieldsSync(this.$parent||this,user);
        await _.mapAsync(actions,async (action)=>{
             try {
                 acl.actions[action] = await ability (this, action, {user: user});
             }catch (e) {
                 getDefaultLogger().builder()
                 .withError(e)
                 .withData({
                     doc:this.toObject(),
                     user_id:user.id||user._id
                 })
                 .withLevel('warn')
                 .log()
             }
        });
        return acl;
    };

    schema.virtual('acl').get(function () {
        return this._acl;
    }).set(function(value){
        this._acl = value;
    });

    schema.methods.protectedInput = function (valuesMap,user) {
        if(!dispatcher.isReady)
            return new Error('Not ready');
        let protectedFields = dispatcher.docProtectedFieldsSync(this.$parent||this,user);
        let privateFields = dispatcher.docPrivateFieldsSync(this.$parent||this,user);
        let allFields = protectedFields.concat(privateFields);
        let allowedValuesMap = _.omit(valuesMap,allFields);
        _.each(allowedValuesMap,(val,key)=>{
            this.set(key,val);
        });
        return this;
    }
}