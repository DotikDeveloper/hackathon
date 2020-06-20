import {
    method,
    pagination,
    ability,
    viewConvert,
    mutation,
    editResponseConvert,
    createResponseConvert, removeResponseConvert
} from "../module";
import _ from "underscore";
import AbstractResolver from "./AbstractResolver";

export default class DefaultResolver extends AbstractResolver{
    constructor(model){
        super();
        this.model = model;
    }

    @method
    async defaultModel(obj,args,context,info){
        let model = new this.model({});
        return model;
    }

    get typeName(){
        if(this.model){
            return _.upperFirst (this.model.collection.name)
        }
        return null;
    }

    get rootName(){
        if(this.model){
            return this.model.collection.name;
        }
        return null;
    }

    @method
    @ability('list')
    @pagination
    list(obj, args, ctx, info){
        return this.model.find();
    }

    @method
    @ability('view')
    @viewConvert
    async view(obj, {_id}, ctx , info){
        let condition = {_id:_id};
        return this.model.findOne(condition);
    }

    @mutation
    @ability('edit')
    @editResponseConvert
    async edit(parent,args,{user,ability},info){
        let condition = {_id:args._id};
        let model = await this.model.findOne(condition);
        if(!model)
            return null;
        _.each(args.model,(val,key)=>{
            model[key] = val;
        });
        let response = await model.save();
        return response;
    }

    @mutation
    @createResponseConvert
    @ability('create')
    async create(parent,{model},ctx){
        let mongooseModel = new this.model(model);
        if(!mongooseModel)
            return null;
        let result = await mongooseModel.save();
        return result;
    }

    @removeResponseConvert
    @ability('remove')
    async remove(parent,{_id},ctx){
        return this.model.deleteOne({_id:_id});
    }
}