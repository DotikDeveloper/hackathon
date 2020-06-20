import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import _ from 'underscore';
import SmartGraphqlForm from "/client/components/SmartGraphqlForm";
import {createDefaultObject} from "/client/vue-form-generator/utils/schema";
import {codemirror, userId} from "/client/vue-form-generator/schemaBoilerplates";
import {FILTER_MODE} from "../../../../lib/enums";
import CustomQueryFilter from "../../../../lib/CustomQueryFilter";

const fragment = `
	_id
	name	
	dataExpression
	parent_item_id
	user_id
	index
	rules
    parentItem{_id name}
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
                model: 'index',
                type: 'input', inputType: 'number',
                default:0,
                label: 'Индекс сортировки'
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
                        "label": "ID владельца"
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
                        "label": "ID владельца"
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
                model: 'dataExpression',
                required: true,
                label: 'Код, возвращающий данные'
            },
            {
                model: 'parent_item_id',
                label: 'Родительский элемент',
                type:'autocomplete',
                multiple:false,
                placeholder:'Выберите элемент',
                apollo:{
                    query:gql`
                        query NodesAutocomplete($pagination:PaginationOptions){
                            navItems{
                                list(pagination:$pagination){
                                    rows{
                                        name _id parentItem{
                                            name _id
                                        }
                                    }
                                }
                            }
                        }
                    `,
                    variables:(options)=>{
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
                        return _.chain(data.navItems.list.rows)
                        .map(/**@param {NavItems}*/(navItem)=>{
                            return {
                                id:navItem._id,
                                label:navItem.parentItem?`${navItem.parentItem.name} > ${navItem.name}`:navItem.name
                            };
                        })
                        .value();
                    }
                }

            },
            {
                ...userId(),
                label: 'Владелец'
            }
        ]
    }
}

const MODULE_NAME = 'navItems';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: SmartGraphqlForm,
        meta: {
            title: 'Новый элемент меню навигации',
            breadcrumbs: {
                label: 'Создать новый',
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'create',
            schema: vueSchemaFactory,
            gqlRoot: 'navItems',
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
            }
        }
    }, {
        path: `${MODULE_PATH}/update/:_id`,
        name: `${MODULE_NAME}Update`,
        component: SmartGraphqlForm,
        meta: {
            title: async function () {
                await this.apolloLoaded ();
                return `Изменить Элементы меню навигации "${this.model.name}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Изменить Элементы меню навигации "${this.model.name}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'update',
            schema: vueSchemaFactory,
            gqlRoot: 'navItems',
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
            title:'Элементы меню навигации',
            breadcrumbs: {
                label: 'Элементы меню навигации',
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
                            to: {name: `${MODULE_NAME}Update`, params: {_id: row._id}},
                            anchor: row.name
                        }
                    },
                    filterOptions: {
                        enabled: true, // enable filter for this column
                        placeholder: 'Поиск..', // placeholder for filter input
                        filterValue: undefined, // initial populated value for this filter
                        trigger: 'enter', //only trigger on enter not on keyup
                        transform ($input) {
                            return String ($input).length > 0 ? new RegExp ($input, 'i') : undefined;
                        }
                    }
                }, {
                    label:'Индекс сортировки',field:'index'
                },{
                    label: 'Владелец', field: 'user_id',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {name: `usersUpdate`, params: {_id: row.user_id}},
                            disabled:!row.user,
                            anchor: row.user?.name || '<Неизвестно>'
                        }
                    },
                    filterOptions: {
                        enabled: true, // enable filter for this column
                        placeholder: 'Поиск..', // placeholder for filter input
                        filterValue: undefined, // initial populated value for this filter
                        trigger: 'enter', //only trigger on enter not on keyup
                        transform ($input) {
                            return String ($input).length > 0 ? new RegExp ($input, 'i') : undefined;
                        }
                    }
                },

                {
                    label: 'Родитель', field: 'parent_item_id',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {name: `${MODULE_NAME}Update`, params: {_id: row.parent_item_id}},
                            disabled:!row.parentItem,
                            anchor: row.parentItem?.name || '<Нет>'
                        }
                    },
                    filterOptions: {
                        enabled: true, // enable filter for this column
                        placeholder: 'Поиск..', // placeholder for filter input
                        filterValue: undefined, // initial populated value for this filter
                        trigger: 'enter', //only trigger on enter not on keyup
                        transform ($input) {
                            return String ($input).length > 0 ? new RegExp ($input, 'i') : undefined;
                        }
                    }
                },{
                    label: 'Код, возвращающий данные', field: 'dataExpression',
                    filterOptions: {
                        enabled: true, // enable filter for this column
                        placeholder: 'Поиск..', // placeholder for filter input
                        filterValue: undefined, // initial populated value for this filter
                        trigger: 'enter', //only trigger on enter not on keyup
                        transform ($input) {
                            return String ($input).length > 0 ? new RegExp ($input, 'i') : undefined;
                        }
                    }
                }
            ],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        navItems{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.navItems.list.rows;
                    this.totalRecords = data.navItems.list.total;
                }
            }
        }
    }
];