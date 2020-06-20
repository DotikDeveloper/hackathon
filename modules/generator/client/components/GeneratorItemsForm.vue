<template>
    <graphql-model-form
            :key="template_id"
            v-if="libLoaded && schema"
            :mode="mode"
            :schema="schema"
            :apollo="apollo"
            :events="events"
            @model-updated="onModelManualUpdated"
            ref="child"
            :model="model"
            :buttons="buttons"
    />
</template>

<script>
    import IRLibLoader from "/lib/IRLibLoader";
    import {uniqueId,cloneDeep} from 'lodash';
    import _ from 'underscore';
    import gql from 'graphql-tag';
    import {graphqlClone} from "/lib/utils";
    import {createDefaultObject} from "/client/vue-form-generator/utils/schema";
    import GraphqlModelForm from "/client/components/GraphqlModelForm";

    const templatesFragment = `
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
    const itemsFragment = `
       _id
name
template_id
template{
    _id name
}
templateData
    `;

    export default {
        components:{GraphqlModelForm},
        props:{
            mode:{type:String,default:'create'}
        },
        data(){
            const self = this;
            return {
                libLoaded:false,
                templateDataHistory:{},
                template_id:'',
                model:{
                    _id:'',
                    templateData:{}
                },
                apollo:{
                    queries:{
                        validate:{
                            query:gql`
                                query GeneratorItemsValidate($model:JSONObject!){
                                    generatorItems{
                                        validate(model:$model){
                                            errors{
                                                message
                                                type
                                                path
                                                value
                                                field
                                            }
                                        }
                                    }
                                }
                            `,
                            variables(){
                                return {
                                    model:graphqlClone(this.model)
                                }
                            },
                            update(data){
                                this.validateResult = data.generatorItems.validate;
                            }
                        },
                        create:null,
                        update:null
                    },
                    mutations:{
                        create:{
                            mutation:gql`
                                mutation GeneratorsItemsCreate($model:JSONObject){
                                    generatorItems{
                                        create(model:$model){
                                            success,message,errors,_id,model
                                        }
                                    }
                                }
                                `,
                            variables(){
                                return {
                                    model:graphqlClone(this.model)
                                }
                            }
                        },
                        update:{
                            mutation:gql`mutation GeneratorItemsEdit($_id:String!,$model:JSONObject!) {
                                generatorItems{
                                    edit(_id:$_id,model:$model){
                                        message,success,errors
                                    }
                                }
                            }`,
                            variables(){
                                return {
                                    _id:this.model._id,
                                    model:graphqlClone(this.model)
                                };
                            }
                        }
                    }
                },
                events:{
                    submit(){
                        this.$router.push({ name: `generatorItemsIndex`});
                    },
                    cancel(){
                        this.$router.push({ name: `generatorItemsIndex`});
                    }
                },
                schema:this.defaultSchema(),
                buttons:function(){
                    return [
                        {
                            "name":'successButton',
                            "type": "submit",
                            "buttonText": "Готово",
                            "readonly": false,
                            "featured": false,
                            "disabled": false,
                            "onSubmit": _.bind(this.onSubmit, this),
                            validateBeforeSubmit: true,
                            styleClasses: ' col-',
                            fieldClasses: 'btn btn-success',
                            visible: () => {
                                if(this.mode == 'create')
                                    return true;
                                if(this.mode=='update')
                                    return this.model && this.model._id && this.changed;
                            }
                        }, {
                            "name":'cancelButton',
                            "type": "submit",
                            "buttonText": "Отмена",
                            "onSubmit": _.bind(this.onCancel, this),
                            visible: () => {
                                if(this.mode == 'create')
                                    return false;
                                if( this.mode=='update')
                                    return this.model && this.model._id && this.changed;
                            },
                            styleClasses: ' col-',
                            fieldClasses: 'btn btn-danger'
                        },{
                            "name":'exportButton',
                            "type": "submit",
                            "buttonText": "Выгрузить",
                            "onSubmit": _.bind(self.doExport, this),
                            styleClasses: ' col-',
                            fieldClasses: 'btn btn-outline-info'
                        }
                    ]
                }
            }
        },
        async created(){
            let markLoaded = this.markLoading();
            try {
                await IRLibLoader.getInstance ().load (`/generatorSchema.js?hash=${uniqueId ()}`);
                this.libLoaded = true;
                if (this.mode === 'update') {
                    let response = await this.apolloQuery ({
                        query: gql`
                                query GeneratorItemsView($_id:String!){
                                    generatorItems{
                                        view(_id:$_id){
                                            ${itemsFragment}
                                        }
                                    }
                                }
                            `,
                        variables: {_id: this.$route.params._id}
                    });
                    this.model = response.data.generatorItems.view;
                    this.onModelUpdated (false);
                } else {
                    this.model = {
                        template_id: null,
                        templateData: {}
                    };
                }
            }finally {
                markLoaded();
            }
        },

        computed:{
        },
        methods:{
            async findTemplates(ids){
                let response = await this.apolloQuery({
                    query:gql`query GeneratorTemplatesList($pagination:PaginationOptions!){
                        generatorTemplates{
                            list(pagination:$pagination){
                                rows{
                                   ${templatesFragment}
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
                            model:'name',
                            type:'input','inputType':'text',
                            required:true,
                            validator:'required',
                            label:'Имя'
                        },
                        {
                            model:'template_id',
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
                                    filters.isRoot = true;
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
            },
            onModelManualUpdated(){
                this.onModelUpdated(true);
            },
            onModelUpdated(manual){
                if(this.model&&this.model.template_id!==this.template_id){
                    if(manual){
                        this.model.templateData = {};
                    }
                    this.template_id = this.model.template_id;
                }
            },
            async doExport(){
                let model = {
                    _id:this.model.template_id,
                    templateData:graphqlClone(this.model.templateData)
                }
                let response = await this.$apollo.mutate({
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
                    variables:{
                        model:model
                    }
                });
                console.log({response});
                window.location = response.data.generatorTemplates.generate.url;
            }
        },
        watch:{
            template_id:async function(template_id){
                const schema = this.defaultSchema();
                if(template_id){
                    this.schema = null;
                    let templateSchema = window['generatorSchema'][template_id];
                    const $parent  = _.first( await this.findTemplates([template_id]) );

                    if(_.isFunction(templateSchema)){
                        templateSchema = templateSchema.apply(this,[$parent]);
                    }else{
                        templateSchema = cloneDeep(templateSchema);
                    }
                    const templateDataSchema = {
                        model:'templateData',
                        type:'object',
                        schema:templateSchema,
                        default:{}
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

                                    let itemSchema = window['generatorSchema'][$template._id];
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
                    console.log({beforeCreateDefaultObject:this.model.templateData});
                    this.model = createDefaultObject(schema,this.model);
                    console.log({afterCreateDefaultObject:this.model.templateData});
                }
                console.log({schema});
                this.schema = schema;
            }
        }
    }
</script>