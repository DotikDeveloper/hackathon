import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import _ from 'underscore';
import SmartGraphqlForm from "../../../../client/components/SmartGraphqlForm";
import GeneratorTemplateTest from "../components/GeneratorTemplateTest";
import {cloneDeep} from 'lodash';

const fragment = `
_id
name
description
isRoot
schemaExpression
helpersExpression
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
acl
`;

function vueSchemaFactory(){
    let codemirror = function(){
        return {
            type:'codemirror',
            // eslint-disable-next-line no-unused-vars
            validator:function(value, field, model){
                if(_.isEmpty(value) ){
                    return ['Поле обязательно'];
                }
                return [];
            },
            codeMirrorOptions:{
                lineNumbers: true,
                mode:'javascript',
                gutters: ["CodeMirror-lint-markers"],
                lint: {
                    esversion: 6
                },
                resize:{
                    minWidth:  200,               //Minimum size of the CodeMirror editor.
                    minHeight: 100,
                    resizableWidth:  true,        //Which direction the editor can be resized (default: both width and height).
                    resizableHeight: true,
                    cssClass: 'cm-resize-handle', //CSS class to use on the *default* resize handle.
                }
            }
        }
    };

    return {
        theme:'bootstrap',
        template:`<div style="max-width:100%;">
<div class="row">
    <div class="col">
        <vfg-field for="isRoot"/>
    </div>
    <div class="col">
        <vfg-field for="name"/>
    </div>
    <div class="col">
        <vfg-field for="description"/>
    </div>
</div>
<div class="row">
    <div class="col">
        <vfg-field for="children"/>
    </div>
</div>
<div class="row">
    <div class="col-xs-6" style="max-width:50%;">
        <vfg-field for="schemaExpression"/>
    </div>
    <div class="col-xs-6" style="max-width:50%;">
        <vfg-field for="helpersExpression"/>
    </div>
</div>
<div class="row">
    <div class="col">
        <vfg-field for="templateItems"/>
    </div>
</div>
<div class="row">
    <div class="col-sm-auto">
        <vfg-field for="successButton"/>
    </div>
    <div class="col-sm-auto">
        <vfg-field for="cancelButton"/>
    </div>
</div>
</div>
`,

        fields:[
            {
                model: "name",
                type: "input",
                inputType: "text",
                label: 'Название шаблона',
                required:true,
                validator:'required'
            },{
                model:'isRoot',
                type:'switch',
                label:'Root',
                default:false
            },
            {
                model:'description',
                type: 'textArea',
                label: 'Описание',
                rows: 10,cols:30
            },

            {
                model:'children',
                label:'Дочерние шаблоны',
                type:'array',
                items:{
                    type: 'object',
                    schema:{
                        fields:[{
                                model:'_id',
                                type:'autocomplete',
                                label:'Выберите шаблон',
                                multiple:false,
                                placeholder:'Выберите...',
                                apollo:{
                                    query:gql`
                                        query GeneratorTemplatesAutocomplete($pagination:PaginationOptions){
                                            generatorTemplates{
                                                list(pagination:$pagination){
                                                    rows{
                                                        name _id
                                                    }
                                                }
                                            }
                                        }
                                    `,
                                    variables (options){
                                        let filters = {
                                            isRoot:false
                                        };
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
                                        .map((m)=>{
                                            return {id:m._id,label:m.name};
                                        })
                                        .value();
                                    }
                                },
                                required: true
                            },{
                                model:'multiple',
                                label:'Множественный',
                                type:'switch',
                                default:false
                            }
                        ]
                    }
                }
            },

            {
                ...codemirror (),
                model: 'schemaExpression',
                label: 'VFG схема',
            },{
                ...codemirror(),
                model: 'helpersExpression',
                label: 'Объект-хелпер',
                validator(){
                    return [];
                }
            },{
                model:'templateItems',
                type:'array',
                items:{
                    type:'object',
                    schema:{
                        fields:[
                            {
                                model:'path',
                                label:'Путь',
                                type:'input',
                                inputType:'text',
                                required:true,
                            },{
                                model:'template',
                                label:'Шаблон файла',
                                type:'codemirror',
                                // eslint-disable-next-line no-unused-vars
                                validator:function(value, field, model){
                                    return [];
                                },
                                codeMirrorOptions:{
                                    lineNumbers: true,
                                    mode:"null",
                                    gutters: ["CodeMirror-lint-markers"],
                                    resize:{
                                        minWidth:  200,               //Minimum size of the CodeMirror editor.
                                        minHeight: 100,
                                        resizableWidth:  true,        //Which direction the editor can be resized (default: both width and height).
                                        resizableHeight: true,
                                        cssClass: 'cm-resize-handle', //CSS class to use on the *default* resize handle.
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        ]
    }
}

const MODULE_NAME = 'generatorTemplates';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [{
        path: `${MODULE_PATH}/test`,
        name: `${MODULE_NAME}Test`,
        component: GeneratorTemplateTest,
        meta: {
            title:'Протестировать шаблон',
            breadcrumbs:{
                label:'Протестировать шаблон',
                parent:`${MODULE_NAME}Index`
            }
        },
},{
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: SmartGraphqlForm,
        meta: {
            title:'Создать новый',
            breadcrumbs:{
                label:'Создать новый',
                parent:`${MODULE_NAME}Index`
            }
        },
        props:{
            mode:'create',
            schema:vueSchemaFactory,
            gqlRoot:'generatorTemplates',
            fragment:fragment,
            events:{
                submit(){
                    this.$router.push({ name: `${MODULE_NAME}Index`});
                },
                cancel(){
                    this.$router.push({ name: `${MODULE_NAME}Index`});
                }
            }
        }
    },{
        path:`${MODULE_PATH}/update/:_id`,
        name:`${MODULE_NAME}Update`,
        component: SmartGraphqlForm,
        meta: {
            title:async function(){
                await this.apolloLoaded();
                return `Изменить шаблон генератора "${this.model.name}"`;
            },
            breadcrumbs:{
                label:async function(){
                    await this.apolloLoaded();
                    return `Изменить шаблон генератора "${this.model.name}"`;
                },
                parent:`${MODULE_NAME}Index`
            }
        },
        props:{
            mode:'update',
            schema:vueSchemaFactory,
            gqlRoot:'generatorTemplates',
            fragment:fragment,
            events:{
                submit(){
                    this.$router.push({ name: `${MODULE_NAME}Index`});
                },
                cancel(){
                    this.$router.push({ name: `${MODULE_NAME}Index`});
                }
            }
        }
    },{
        path:`${MODULE_PATH}`,
        name:`${MODULE_NAME}Index`,
        component:GraphqlPagination,
        meta: {
            title:'Шаблоны генератора',
            breadcrumbs:{
                label:'Шаблоны генератора',
                parent:'home'
            }
        },
        props:{
            header:'DynamicLink',
            headerParams:{
                to:`${MODULE_PATH}/create`,
                anchor:'Создать'
            },
            columns: [
                {
                    label:'Имя',field:'name',
                    component:'DynamicLink',
                    componentParams(row){
                        return {
                            to:{name:`${MODULE_NAME}Update`,params:{_id:row._id}},
                            anchor: row.name
                        }
                    },
                    filterOptions: {
                        enabled: true, // enable filter for this column
                        placeholder: 'Поиск..', // placeholder for filter input
                        filterValue: undefined, // initial populated value for this filter
                        //filterDropdownItems: [], // dropdown (with selected values) instead of text input
                        //filterFn: this.columnFilterFn, //custom filter function that
                        trigger: 'enter', //only trigger on enter not on keyup
                        transform($input){
                            return String($input).length>0 ? new RegExp($input,'i'):undefined;
                        }
                    },
                },{
                    label:'root',field:'isRoot',
                    // eslint-disable-next-line no-unused-vars
                    formatFn(value){
                        return value ? 'Да':'Нет'
                    }
                },{
                    label:'Дочерние шаблоны',field:'childrenTemplates',
                    // eslint-disable-next-line no-unused-vars
                    formatFn(value){
                        if(!_.isArray(value))
                            return '';
                        return _.chain(value)
                        .map(/**@param {GeneratorTemplates} child*/(child)=>{
                            return `"${child.name}"`;
                        })
                        .value()
                        .join(',')
                    }
                },{
                    label:'Операции',field:'_id',
                    component:'DynamicLink',
                    componentParams(row){
                        return {
                            to:{name:`${MODULE_NAME}Test`,params:{_id:row._id}},
                            anchor: 'Протестировать'
                        }
                    },
                }
            ],
            query:{
                query:gql`
                    query List($pagination:PaginationOptions!){
                    generatorTemplates{
                        list(pagination:$pagination){
                            rows{
                                ${fragment}
                            },
                            total
                        }
                    }
                }`,
                update(data){
                    this.rows = data.generatorTemplates.list.rows;
                    this.totalRecords = data.generatorTemplates.list.total;
                }
            }
        }
    }
];