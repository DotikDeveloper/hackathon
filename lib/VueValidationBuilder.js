import _ from 'underscore';

function isPromise(obj) {
    return obj instanceof Promise || (obj && typeof obj.then === 'function');
}

export class VueValidationBuilder {

    constructor(){
        this.validators = [];
    }

    validator(){
        let self = this;
        return function(value,field,model){
            return Promise.all(_.map(self.validators,(validator)=>{
                let validResult = validator.apply(this,[value,field,model]);
                if(isPromise(validResult))
                    return validResult;
                return Promise.resolve(validResult);
            })).then((results)=>{
                return _.flatten(results);
            });
        }
    }

    custom(validator){
        this.validators.push(validator);
        return this;
    }

    unique(collection,keys){
        //@ts-ignore
        collection = _.isString(collection)?Meteor.connection._stores[collection]._getCollection():collection;
        this.validators.push(function(value,field,model){
            if(!keys)
                keys = field.model;
            if(!_.isArray(keys)) {
                //@ts-ignore
                keys = [keys];
            }

            let condition = {};
            _.each(keys,(key)=>{
                condition[key] = model[key];
            });
            if(model._id){
                condition['_id']={$ne:model._id};
            }
            return new Promise((resolve =>{
                if(Meteor.isClient) {
                    //@ts-ignore
                    Meteor.subscribe(collection._name, condition, () => {
                        resolve();
                    });
                }else {
                    return resolve();
                }
            })).then((resolve)=>{
                //@ts-ignore
                let oldModel = collection.findOne(condition);
                console.log('model:',model);
                console.log('condition:',condition);
                console.log('oldModel:',oldModel);
                if(oldModel){
                    return ['Поле должно быть уникальным'];
                }
                return [];
            });
        });
        return this;
    }

    userId():this{
        this.validators.push(function(value,field,model){
            return (!value||value != this.$userId)?['Недопустимое значение']:[];
        });
        return this;
    }
}