import DefaultResolver from "./DefaultResolver";
import {
    ability3 as ability,
    createResponseConvert,
    editResponseConvert,
    pagination, removeResponseConvert,
    viewConvert
} from "../module";
import _ from 'underscore';
import ObservePubSub from "../pubsub/ObservePubSub";

class CrudResolver2 extends DefaultResolver{
    constructor (model) {
        super (model);
    }

    populate(query){
        return query;
    }
    
    @createResponseConvert
    @ability('create','create')
    // eslint-disable-next-line no-unused-vars
    async create(parent,{model},ctx){
        let mongooseModel = new this.model(model);
        if(!mongooseModel)
            return null;
        let result = null;
        try{
            result = await mongooseModel.save();
        }catch (e) {
            console.error(e);
            throw e;
        }
        ctx.result = result;
        return result;
    }

    @editResponseConvert
    @ability('edit','edit')
    // eslint-disable-next-line no-unused-vars
    async edit(parent,args,ctx,info){
        let condition = {_id:args._id};
        let model = await this.model.findOne(condition);
        if(!model)
            return null;
        let valuesWithoutId = _.omit(args.model,['id','_id']);
        model.protectedInput(valuesWithoutId,ctx.user);
        let response = await model.save();
        ctx.result = response;
        return response;
    }

    @ability('list','pagination')
    @pagination
    // eslint-disable-next-line no-unused-vars
    list(obj, args, ctx, info){
        return this.populate(
            this.model
            .find()
        );
    }

    @viewConvert
    @ability('view','view')
    // eslint-disable-next-line no-unused-vars
    async view(obj, {_id}, ctx , info){
        let condition = {_id:_id};
        return this.populate( this.model.findOne(condition) );
    }

    @removeResponseConvert
    @ability('remove')
    // eslint-disable-next-line no-unused-vars
    async remove(parent,{_id},ctx){
        return this.model.deleteOne({_id:_id});
    }

    @pagination
    // eslint-disable-next-line no-unused-vars
    async autocomplete(obj, args, ctx, info){
        let rows = await this.model
        .find(args.$condition)
        .sort(args.$sort)
        .skip(args.$skip)
        .limit(args.$limit)
        .lean({virtuals: true})
        .exec();

        let total = await this.model
        .find(args.$condition)
        .countDocuments();

        return {
            rows:rows,
            total
        }
    }

    // eslint-disable-next-line no-unused-vars
    async validate(obj,args,ctx,info){
        let newModel = new this.model(args.model);
        let oldModel = null;
        if(newModel._id){
            oldModel = await this.model.findOne({_id:newModel._id});
            if(oldModel){
                _.each(args.model,(val,key)=>{
                    oldModel[key]=val;
                });
            }
        }
        let model = oldModel||newModel;
        return await new Promise((resolve)=>{
            model.validate(function (err) {
                let errors = [];
                if (err) {
                    _.each (err.errors, (err, fieldName) => {
                        errors.push ({
                            message: err.message,
                            type: err?.properties?.type||'Unknown',
                            path: err?.properties?.path||'Unknown',
                            value: err?.properties?.value||'Unknown',
                            field: fieldName
                        });
                    });
                }
                resolve({errors:errors});
            });
        });
    }

    /**
     * @param {SubscriptionOptions} options
     * */
    subscribe(query,options={}){
        let observeChanges = _.bind(options.deep?query.observeDeepChanges:query.observeChanges,query);

        let observer = observeChanges({
            added () {

            },
            changed () {

            },
            removed () {

            }
        },options);
        return new ObservePubSub ({observer}).asyncIterator (['added', 'changed', 'removed']);
    }
}

export default CrudResolver2;