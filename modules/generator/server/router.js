import express from "express";
import GeneratorTemplates from "../models/GeneratorTemplates";
const router  = express.Router();
import _ from 'underscore';

router.get('/generatorSchema.js',
    async function(req, res){
        res.set('Content-Type', 'text/javascript;charset=UTF-8')

        /**@type GeneratorTemplates[]*/
        let templates = await GeneratorTemplates.find();
        const $code = [];
        $code.push( `var obj = {};` );
        _.each(templates,/**@param {GeneratorTemplates} menuTemplate*/(generatorTemplate)=>{
            $code.push( `obj['${generatorTemplate.id}'] = ${generatorTemplate.schemaExpression}` );
        });

        $code.push('window.generatorSchema = obj;');

        res.send($code.join('\n'));

    });

export default router;