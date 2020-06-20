import GraphqlForm from "/client/components/GraphqlForm";
import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import {graphqlClone} from "../../../../lib/utils";
import _ from 'underscore';
import {FIELD_BUILDER_TYPE} from "../../../../lib/enums";
import {codemirror} from "../../../../client/vue-form-generator/schemaBoilerplates";

const fragment = `_id
                name
                fieldType
                labelExpression
                modelNames
                mongoPathExpression
                mongoValueExpression
                acl
                `;

function vueSchemaFactory(){
    return {
        fields:[
            {
                model: "name",
                type: "input",
                inputType: "text",
                label: "Название",
                readonly: false,
                disabled: false,
                required:true,
                validator:'required'
            },
            {
                model:'fieldType',
                type: "select",
                label: "Тип значения",
                required: true,
                values:FIELD_BUILDER_TYPE.toSelect(),
                validator:'required'
            },{
                ...codemirror(),
                model: "labelExpression",
                label:'Код, возвращающий строку названия фильтра'
            },{
                model:'modelNames',
                type:'autocomplete',
                label:'Коллекции',
                multiple:true,
                placeholder:'Выберите...',
                apollo:{
                    query:gql`
                        query AclFiltersAutocomplete($pagination:PaginationOptions){
                            aclFilters{
                                resourceNames(pagination:$pagination){
                                    rows{
                                        name label
                                    }
                                }
                            }
                        }
                    `,
                    variables (options){
                        let filters = {};
                        if(options.term){
                            filters.label = new RegExp(options.term,'i');
                        }
                        if(options.ids){
                            filters.name = {$in:options.ids};
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
                        return _.chain(data.aclFilters.resourceNames.rows)
                        .map((m)=>{
                            return {id:m.name,label:m.label};
                        })
                        .value();
                    }
                }
            },{
                ...codemirror(),
                model:'mongoPathExpression',
                label:'Возвращает путь в документе'
            },{
                ...codemirror(),
                model:'mongoValueExpression',
                label:'Возвращает значение в документе',
            }
        ]
    }
}

const MODULE_NAME = 'aclFilters';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: GraphqlForm,
        meta: {
            title:'Создать новый',
            breadcrumbs:{
                label:'Шаблоны фильтров',
                parent:'home'
            }
        },
        props:{
            mode:'create',
            schema:vueSchemaFactory,
            apollo:{
                queries:{
                    create:null
                },
                mutations:{
                    create:{
                        mutation:gql`
                            mutation AclFiltersCreate($model:JSONObject!){
                                aclFilters{
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
                    }
                }
            },
            events:{
                submit(){
                    this.$router.push({ name: `${MODULE_NAME}Index`});
                },
                cancel(){
                    this.$router.push({ name: `${MODULE_NAME}Index`});
                }
            }
        }
    },

    {
        path:`${MODULE_PATH}/update/:_id`,
        name:`${MODULE_NAME}Update`,
        component: GraphqlForm,
        meta: {
            title:async function(){
                await this.apolloLoaded();
                return `Изменить шаблон фильтров "${this.model.name}"`;
            },
            breadcrumbs:{
                label:'Шаблоны фильтров',
                parent:'home'
            }
        },
        props:{
            mode:'update',
            schema:vueSchemaFactory,
            apollo:{
                queries:{
                    update:{
                        query:gql(`
                            query AclFiltersView($_id:String!){
                                aclFilters{
                                    view(_id:$_id){
                                        ${fragment}
                                    }
                                }
                            }
                        `),
                        variables(){
                            return {
                                _id: this.$route.params._id
                            }
                        },
                        update(data){
                            this.model = data.aclFilters.view;
                        }
                    }
                },
                mutations:{
                    update:{
                        mutation:gql`
                            mutation Edit ($_id:String!,$model:JSONObject!) {
                                aclFilters{
                                    edit(_id:$_id,model:$model){
                                        message,success,errors
                                    }
                                }
                            }
                        `,
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
                    this.$router.push({ name: `${MODULE_NAME}Index`});
                },
                cancel(){
                    this.$router.push({ name: `${MODULE_NAME}Index`});
                }
            }
        }
    },

    {
        path:`${MODULE_PATH}`,
        name:`${MODULE_NAME}Index`,
        component:GraphqlPagination,
        meta: {
            breadcrumbs:{
                label:'Проекты',
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
                    label:'Тип значения',field:'fieldType',
                    formatFn(fieldType){
                        return FIELD_BUILDER_TYPE[fieldType]?.label||'<Неизвестно>'
                    }
                },{
                    label:'Возвращает путь в документе',field:'mongoPathExpression',
                },{
                    label:'Возвращает значение в документе',field:'mongoValueExpression',
                }
            ],
            query:{
                query:gql(`
                    query List($pagination:PaginationOptions!){
                    aclFilters{
                        list(pagination:$pagination){
                            rows{
                                ${fragment}
                            },
                            total
                        }
                    }
                }`),
                update(data){
                    this.rows = data.aclFilters.list.rows;
                    this.totalRecords = data.aclFilters.list.total;
                }
            }
        }
    }
];