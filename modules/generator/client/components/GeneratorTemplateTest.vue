<template>
    <graphql-model-form
            :key="template_id"
            v-if="libLoaded && schema"
            mode="create"
            :schema="schema"
            :apollo="apollo"
            :events="events"
            :model="model"
        />
</template>
<script>
    import GraphqlModelForm from "../../../../client/components/GraphqlModelForm";
    import IRLibLoader from "/lib/IRLibLoader";
    import {uniqueId} from 'lodash';
    import _ from 'underscore';
    import gql from 'graphql-tag';
    import {graphqlClone} from "/lib/utils";
    import {cloneDeep} from 'lodash';
    import {createDefaultObject} from "/client/vue-form-generator/utils/schema";

    const fragment = `
_id
name
description
isRoot
schemaExpression
children{
    _id multiple
}
templateItems{
    path template
}
childrenTemplates{
    _id name children{
        _id multiple
    }
}
`;
    export default {
        components:{GraphqlModelForm},
        data(){
            return {
                libLoaded:false,
                template_id:'',
                model:{
                    _id:'',
                    templateData:{}
                },
                apollo:{
                    queries:{
                        create:null,
                    },
                    mutations:{
                        create:{
                            mutation:gql`
                        mutation GeneratorsTemplateGenerate($model:JSONObject){
                            generatorTemplates{
                                generate(model:$model){
                                    _id
                                    url
                                }
                            }
                        }
                        `,
                            variables(){
                                let model = graphqlClone(this.model);
                                return {
                                    model
                                };
                            }
                        }
                    }
                },
                events:{
                    submit(response){
                        console.log({response});
                        window.location = response.data.generatorTemplates.generate.url;
                    },
                    cancel(){
                        this.$router.push({ name: `generatorTemplatesIndex`});
                    }
                },
                schema:this.defaultSchema()
            }
        },
        async created(){
            await IRLibLoader.getInstance().load(`/generatorSchema.js?hash=${uniqueId()}`);
            this.libLoaded = true;
        },

        computed:{
        },
        methods:{
            async findTemplates(ids){
                let response = await this.$apollo.query({
                    query:gql`query GeneratorTemplatesList($pagination:PaginationOptions!){
                        generatorTemplates{
                            list(pagination:$pagination){
                                rows{
                                   ${fragment}
                                }
                            }
                        }
                    }`,
                    variables:{
                        pagination:{
                            filters:{_id:{$in:ids}},
                            page:1,
                            perPage:100,
                            sort:{}
                        }
                    }
                });
                return response.data.generatorTemplates.list.rows;
            },
            defaultSchema(){
                return {
                    fields:[
                        {
                            model:'_id',
                            type:'autocomplete',
                            label:'Шаблон',
                            multiple:false,
                            placeholder:'Выберите шаблон...',
                            apollo:{
                                query:gql`
                        query GeneratorTemplatesList($pagination:PaginationOptions){
                            generatorTemplates{
                                    list(pagination:$pagination){
                                        rows{
                                            name,_id
                                        }
                                    }
                                }
                            }
                    `,
                                variables (options){
                                    let filters = {};
                                    if(options.term){
                                        filters.name = new RegExp(options.term,'i');
                                    }
                                    if(options.ids){
                                        filters._id = {$in:options.ids};
                                    }
                                    let page = options.page || 0;
                                    let perPage = options.perPage||100;

                                    return {
                                        pagination:{
                                            filters:filters,
                                            page:page,
                                            perPage:perPage,
                                            sort:{
                                                name:1
                                            }
                                        }
                                    }
                                },
                                update(data){
                                    return _.chain(data.generatorTemplates.list.rows)
                                    .map((generatorTemplate)=>{
                                        return {id:generatorTemplate._id,label:generatorTemplate.name}
                                    })
                                    .value();
                                }
                            }
                        }
                    ]
                };
            }
        },
        watch:{
            model:{
                handler(newModel){
                    if(newModel._id!==this.template_id){
                        this.template_id = newModel._id;
                    }
                },
                immediate:false,deep:true
            },
            template_id:async function(template_id){
                if(this.model){
                    this.model.templateData = {};
                }
                const schema = this.defaultSchema();
                if(template_id){
                    this.schema = null;
                    const $parent  = _.first( await this.findTemplates([template_id]) );
                    let templateSchema = window['generatorSchema'][template_id];
                    if(_.isFunction(templateSchema)){
                        templateSchema = templateSchema.apply(this,[$parent]);
                    }else{
                        templateSchema = cloneDeep(templateSchema);
                    }
                    const templateDataSchema = {
                        model:'templateData',
                        type:'object',
                        schema:templateSchema
                    };
                    let recursive = async ($parent)=>{
                        let $template_ids = _.pluck($parent.children,'_id');
                        let $fields = [];
                        if (!_.isEmpty($template_ids)) {
                            let $templates = await this.findTemplates($template_ids);
                            await Promise.all(
                                _.map($templates,async ($template)=>{
                                    let multiple = _.chain($parent.children)
                                    .filter(($child)=>{
                                        return $child._id === $template._id;
                                    })
                                    .pluck('multiple')
                                    .first()
                                    .value()||false;

                                    let itemSchema =  window['generatorSchema'][$template._id];
                                    if(_.isFunction(itemSchema)){
                                        itemSchema = itemSchema.apply(this,[$template]);
                                    }else{
                                        itemSchema = cloneDeep(itemSchema);
                                    }
                                    let templateSchema = multiple?{
                                        model:$template._id,
                                        type:'array',
                                        label:`Опции шаблона ${$template.name}`,
                                        items:{
                                            type: 'object',
                                            schema:itemSchema
                                        }
                                    }:{
                                        model:$template._id,
                                        type:'object',
                                        label:`Опции шаблона ${$template.name}`,
                                        schema:itemSchema
                                    };
                                    let $childrenSchema = await recursive($template);
                                    if($childrenSchema){
                                        itemSchema.fields = itemSchema.fields || [];
                                        itemSchema.fields.push($childrenSchema);
                                    }
                                    $fields.push(templateSchema);
                                })
                            );
                            if(!_.isEmpty($fields)){
                                return {
                                    model:'children',
                                    type:'object',
                                    schema:{
                                        fields:$fields
                                    }
                                }
                            }
                        }
                        return null;
                    };
                    let $childrenSchema = await recursive($parent);
                    if($childrenSchema){
                        templateDataSchema.schema.fields.push( $childrenSchema );
                    }
                    schema.fields.push(templateDataSchema);
                    this.model = createDefaultObject(schema,this.model);
                }
                console.log({schema});
                this.schema = schema;
            }
        }
    }
</script>