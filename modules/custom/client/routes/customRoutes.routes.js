import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import _ from 'underscore';
import SmartGraphqlForm from "/client/components/SmartGraphqlForm";
import {createDefaultObject} from "/client/vue-form-generator/utils/schema";
import {codemirror, userId} from "../../../../client/vue-form-generator/schemaBoilerplates";
import CustomQueryFilter from "../../../../lib/CustomQueryFilter";
import {FILTER_MODE} from "../../../../lib/enums";
import {RULE_MODE} from "../../../acl2/enums";

const fragment = `
	_id
	name
	rules
	route
	vueTemplate
	user_id
    user{_id name}
    acl
`;

function vueSchemaFactory () {
    return {
        fields: [
            {
                model: 'name',
                type: 'input', inputType: 'text',
                required: true, validator: 'required',
                label: 'Имя'
            },
            {
                model:'rules',
                type: "QueryBuilder",
                styleClasses:'',
                allow_empty:true,
                allow_invalid:false,
                allow_groups:true,
                filters: _.map([{
                        "id": "user.id",
                        "field": "user.id",
                        "label": "ID пользователя",
                        "type": "string",
                        "operators": ["equal", "not_equal", "in", "not_in", "begins_with", "not_begins_with", "contains", "not_contains", "ends_with", "not_ends_with", "is_empty", "is_not_empty", "is_null", "is_not_null"],
                        "variables": [{
                            "name": "user_id",
                            "label": "ID владельца роута"
                        }],
                        mode:FILTER_MODE.variable.key
                    },{
                        "field": "user.login",
                        "id": "user.login",
                        "label": "Логин пользователя",
                        "type": "string",
                        "operators": ["equal", "not_equal", "in", "not_in", "begins_with", "not_begins_with", "contains", "not_contains", "ends_with", "not_ends_with", "is_empty", "is_not_empty", "is_null", "is_not_null"],
                        "variables": [],
                        mode:FILTER_MODE.expression.key
                    },{
                        "field": "user.email",
                        "id": "user.email",
                        "label": "Email пользователя",
                        "type": "string",
                        "operators": ["equal", "not_equal", "in", "not_in", "begins_with", "not_begins_with", "contains", "not_contains", "ends_with", "not_ends_with", "is_empty", "is_not_empty", "is_null", "is_not_null"],
                        "variables": [],
                        mode:FILTER_MODE.expression.key
                    },{
                        "field": "user.roleName",
                        "id": "user.roleName",
                        "label": "Роль пользователя",
                        "type": "string",
                        "operators": ["equal", "not_equal", "in", "not_in", "begins_with", "not_begins_with", "contains", "not_contains", "ends_with", "not_ends_with", "is_empty", "is_not_empty", "is_null", "is_not_null"],
                        "variables": [],
                        mode:FILTER_MODE.expression.key
                    },{
                        "field": "user.currentUserId",
                        "id":"user.currentUserId",
                        "label": "ID субаккаунта",
                        "type": "string",
                        "operators": ["equal", "not_equal", "in", "not_in", "begins_with", "not_begins_with", "contains", "not_contains", "ends_with", "not_ends_with", "is_empty", "is_not_empty", "is_null", "is_not_null"],
                        "variables": [{
                            "name": "user_id",
                            "label": "ID владельца роута"
                        }],
                        mode:FILTER_MODE.variable.key
                    }],(options)=>{
                        return new CustomQueryFilter(options).filter()
                    })
                ,
                // eslint-disable-next-line no-unused-vars
                validator:(value,model)=>{
                    return [];
                },
                default(){
                    return {
                        "condition" : "AND",
                        "rules" : [],
                        "valid" : true
                    }
                }
            },
            {
                ...codemirror(),
                model: 'route',
                label: 'Объект роута',
                required: true
            },
            {
                type: 'codemirror',
                // eslint-disable-next-line no-unused-vars
                validator: function (value, field, model) {
                    if (field && field.required && (value === '' || value === null || value === undefined) ) {
                        return ['Поле обязательно'];
                    }
                    return [];
                },
                codeMirrorOptions: {
                    selectionPointer: true,
                    lineNumbers: true,
                    mode: {
                        name: "vue"
                    },
                    gutters: ["CodeMirror-lint-markers","CodeMirror-foldgutter"],
                    foldGutter: true,
                    lint: {//JSHINT options
                        esversion: 6,
                        quotmark: false
                    },
                    resize: {
                        minWidth: 200,               //Minimum size of the CodeMirror editor.
                        minHeight: 100,
                        resizableWidth: true,        //Which direction the editor can be resized (default: both width and height).
                        resizableHeight: true,
                        cssClass: 'cm-resize-handle', //CSS class to use on the *default* resize handle.
                    }
                },
                model: 'vueTemplate',
                label: 'Шаблон Vue'
            },
            {
                ...userId(),
                label: 'ID владельца'
            }
        ]
    }
}

async function preload(){
    let response = await this.apolloQuery ({
        query:gql`
            query AclRulesFilters($resources:[String]){
                aclRules{
                    filters(resources:$resources)
                }
            }
        `,
        variables:{
            resources:['customRoutes']
        }
    });
    this.filters = _.chain(response.data.aclRules.filters)
    .map((filter)=>{
        return new CustomQueryFilter({
            ...filter,
            mode:_.size(filter.variables)>0?FILTER_MODE.variable.key:FILTER_MODE.expression.key
        }).filter()
    })
    .value();
    console.log({filters:this.filters});
}

const MODULE_NAME = 'customRoutes';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: SmartGraphqlForm,
        meta: {
            title: 'Создать новый Пользовательские роуты',
            breadcrumbs: {
                label: 'Создать новый',
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'create',
            schema: vueSchemaFactory,
            gqlRoot: 'customRoutes',
            fragment: fragment,
            events: {
                submit () {
                    this.$router.push ({name: `${MODULE_NAME}Index`});
                },
                cancel () {
                    this.$router.push ({name: `${MODULE_NAME}Index`});
                }
            },
            initModel () {
                return createDefaultObject.apply (this, [this.computedSchema, {}]);
            },
        }
    }, {
        path: `${MODULE_PATH}/update/:_id`,
        name: `${MODULE_NAME}Update`,
        component: SmartGraphqlForm,
        meta: {
            title: async function () {
                await this.apolloLoaded ();
                return `Изменить Пользовательские роуты "${this.model.name}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Изменить Пользовательские роуты "${this.model.name}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            preload,
            mode: 'update',
            schema: vueSchemaFactory,
            gqlRoot: 'customRoutes',
            fragment: fragment,
            events: {
                submit () {
                    this.$router.push ({name: `${MODULE_NAME}Index`});
                },
                cancel () {
                    this.$router.push ({name: `${MODULE_NAME}Index`});
                }
            }
        }
    }, {
        path: `${MODULE_PATH}`,
        name: `${MODULE_NAME}Index`,
        component: GraphqlPagination,
        meta: {
            title:'Пользовательские роуты',
            breadcrumbs: {
                label: 'Пользовательские роуты',
                parent: 'home'
            }
        },
        props: {
            header: 'DynamicLink',
            headerParams: {
                to: `${MODULE_PATH}/create`,
                anchor: 'Создать'
            },
            columns: [
                {
                    label: 'Имя', field: 'name',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {name: `customRoutesUpdate`, params: {_id: row._id}},
                            anchor: row.name
                        }
                    },
                },{
                    label: 'user', field: 'Владелец',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {name: `usersUpdate`, params: {_id: row.user_id}},
                            disabled:!row.user,
                            anchor: row?.user?.name || 'Неизвестно'
                        }
                    }
                },

                {
                    label: 'Правила', field: 'rules',
                    formatFn: function (rules) {
                        return _.isEmpty (rules?.rules) ? 'Нет' : 'Да';
                    }
                },

                {
                    label: 'Имя', field: '_id',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: `/customRoutes/component.js?id=${row._id}`,
                            anchor: 'Исходный код'
                        }
                    },
                }

            ],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        customRoutes{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.customRoutes.list.rows;
                    this.totalRecords = data.customRoutes.list.total;
                }
            }
        }
    }
];