import {FILTER_MODE} from "/lib/enums";
import MongoBuilder from "../../lib/MongoBuilder";
import {get as safeGet} from 'lodash';

function convert(ctx,val,vmRunner){
    if(!val)
        return null;
    try {
        console.log({val})
        let data = JSON.parse(val)
            data = data[0];
        let mode = data.mode;
        val = data.values[0] || '';

        if(mode==FILTER_MODE.value.key){
            return val;
        }
        if(mode==FILTER_MODE.expression.key){
            return vmRunner.run(val, ctx);
        }
        if(mode==FILTER_MODE.variable.key){
            return safeGet(ctx,val,null);
        }
    }catch(e){
        console.error(e);
        return null;
    }
}

export default async function(rules,ctx,vmRunner){
    return new MongoBuilder().getMongo(rules, new Date(), {
        convert(val){
            //return ConnectionQuery.parse(ctx, val,{user_id:self.ivrMenu.user_id});
            return convert(ctx, val,vmRunner);
        }
    });
}



