import fs from 'fs';
import GeneratorTemplates from "../../modules/generator/models/GeneratorTemplates";
import EJSON from 'ejson';
import _ from 'underscore';
const DIR = '/home/vlad/WebstormProjects/calls3/.storage/export';

(async ()=>{
    return ;
    let models = await GeneratorTemplates.find();
    try {
        fs.writeFileSync (`${DIR}/GeneratorTemplates.json`, EJSON.stringify (
            _.map(models,(model)=>{
                return model.toObject();
            })
        ));
    }catch (e) {
        console.error(e);
    }
}).apply()