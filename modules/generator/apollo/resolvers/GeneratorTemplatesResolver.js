import {ability3 as ability, methods, mutations} from "../../../../server/apollo/module";
import CrudResolver2 from "../../../../server/apollo/resolvers/CrudResolver2";
import _ from 'underscore';
import GeneratorTemplates from "../../models/GeneratorTemplates";
import TmpFiles from "../../../tmpfiles/TmpFiles";
import JSZip from 'jszip';
import doT from 'dot';
import os from 'os';
import {VMRunner,VMRunnerContext} from 'vmrunner';

export default
@methods(['list','view','autocomplete','validate'])
@mutations(['edit','create','remove','generate'])
class TrunksResolver extends CrudResolver2{
    constructor(){
        super(GeneratorTemplates)
    }
    populate (query) {
        return query.populate('childrenTemplates');
    }

    @ability('list','pagination')
    async autocomplete(obj, args, context, info){
        let result = await super.autocomplete(obj,args,context,info);
        result.rows = _.map(result.rows,/**@param {GeneratorTemplates} generatorTemplate*/(generatorTemplate)=>{
            return {
                name:generatorTemplate._id,
                label:generatorTemplate.name
            };
        });
        return result;
    }

    //@ability('list','pagination')
    // eslint-disable-next-line no-unused-vars
    async generate(obj, {model}, context, info){
        /**@type {GeneratorTemplates}*/
        let generatorTemplate = await GeneratorTemplates.findOne({_id:model._id});
        if(!generatorTemplate)
            throw new Error('Not found');

        const $view = _.clone( model.templateData );
        function compileTemplate(template,scope){
            scope = _.clone(scope);
            scope._ = _;
            template = [
                `{{var _ = it._;}}`,
                ..._.chain(scope)
                .keys()
                .map((key)=>{
                    return `{{var ${key} = it.${key};}}`
                })
                .value()
            ].join(os.EOL)+os.EOL+template;
            let templateSettings = _.clone(doT.templateSettings);
            templateSettings.strip = false;
            let fn = doT.template( template,templateSettings );
            let compiled = fn(scope);
            return String(compiled).trim();
        }

        const zip = new JSZip();
        let tmpFile = new TmpFiles({
            user_id:context.user.id
        });

        /**@param {GeneratorTemplates} $template*/
        async function compile($template,$templateData,$parentData){
            await $template.populate('childrenTemplates').execPopulate();
            let $scope = _.clone($templateData);
            $scope._ = _;
            if($parentData){
                $scope.$parent = $parentData;
            }
            $scope.$template = $template;

            if($template.helpersExpression){
                let runnerScope = new VMRunnerContext()
                .withScopeObj($scope)
                .withWrapScope(false);

                const vmRunner = new VMRunner(runnerScope)
                .withThrow(true)
                .withConvertResult(false);
                let $helper = await vmRunner.run($template.helpersExpression);
                if($helper) {
                    _.each ($helper, (val, key) => {
                        if (_.isFunction (val))
                            $helper[key] = _.bind (val, $helper);
                    });
                    $scope.$helper = $helper;
                    $helper.$scope = $scope;
                }
            }

            _.each($template.templateItems,(templateItem)=>{
                try {
                    let output = compileTemplate (templateItem.template, $scope);
                    let path = compileTemplate (templateItem.path, $scope);
                    zip.file (path, output);
                }catch (e) {
                    throw new Error(`${e.message} при обработке шаблона "${$template.name}"`);
                }
            });
            let promises = _.map($template.childrenTemplates,async ($nextChild)=>{
                let $nextChildDataArr = $templateData.children[$nextChild.id];
                if($nextChildDataArr) {
                    if (!_.isArray ($nextChildDataArr)) {
                        $nextChildDataArr = [$nextChildDataArr];
                    }
                    await _.mapAsync ($nextChildDataArr, async ($nextChildData) => {
                        return compile ($nextChild, $nextChildData, $scope);
                    });
                }
            });
            await Promise.all(promises);
        }

        await compile(generatorTemplate,$view);

        await tmpFile.attach('versions.original', {
            name:`generate-${generatorTemplate.name}.zip`,
            type:'application/zip',
            stream:zip.generateNodeStream({type:'nodebuffer',streamFiles:true})
        });
        let result = await tmpFile.save();
        return result;
    }
}