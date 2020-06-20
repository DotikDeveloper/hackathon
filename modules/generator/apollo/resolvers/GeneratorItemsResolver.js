import {ability3 as ability, createResponseConvert, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import GeneratorItems from "../../models/GeneratorItems";

export default
@methods(['list','view','validate'])
@mutations(['create','edit','remove'])
class GeneratorItemsResolver extends CrudResolver2{
    constructor(){
        super(GeneratorItems)
    }
    populate (query) {
        return query.populate('template');
    }

    @createResponseConvert
    @ability('create','create')
    // eslint-disable-next-line no-unused-vars
    async create(parent,{model},ctx){
        let mongooseModel = new this.model();
        mongooseModel.protectedInput(model,ctx.user);
        if(!mongooseModel)
            return null;
        let result = null;
        try{
            result = await mongooseModel.save();
        }catch (e) {
            console.error(e);
            throw e;
        }
        return result;
    }
}