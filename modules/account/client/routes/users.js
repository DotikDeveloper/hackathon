import GraphqlForm from "/client/components/GraphqlForm";
import GraphqlPagination from "/client/components/GraphqlPagination";
import EJSON from 'ejson';
import gql from 'graphql-tag';
import _ from 'underscore';
import Account from "./../components/Account";
import Login from './../components/Login';
import SmartGraphqlForm from "../../../../client/components/SmartGraphqlForm";
import {graphqlClone} from "../../../../lib/utils";
import {aclVisible} from "../../../../client/vue-form-generator/schemaBoilerplates";

function vueSchemaFactory(){
    let result = {
        theme:'bootstrap',
        fields:[
            {
                model: "login",
                type: "input",
                inputType: "text",
                label: "Логин",
                readonly: false,disabled: false,
                required:true
            },{
                model: 'name',
                type: "input",
                inputType: "text",
                label: "Имя",
            },{
                model:'type',
                type: "select",
                label: "Тип",
                default:'password',
                values:[
                    {id:'password',name: 'Пароль'},
                    {id:'vk',name:'Вконтакте'}
                ],
                visible:aclVisible
            },{
                model: 'password',
                type: "input",
                inputType: "text",
                label: "Пароль",
                visible(model){
                    return model.type === 'password'
                }
            },{
                model:'passport',
                type:'object',
                visible(model,field){
                    return aclVisible(model,field) && model.type === 'vk';
                },
                schema:{
                    fields:[
                        {
                            model:'vk',
                            type:'object',
                            schema:{
                                fields:[{
                                    model:'id',
                                    label:'ID аккаунта Вконтакте',
                                    type:'input',
                                    inputType:'text',
                                    required:true,
                                    min:1,
                                    validator:['number','required'],
                                }]
                            }
                        }
                    ]
                }
            },

            {
                model:'roleName',
                type: "select",
                label: "Роль",
                required: true,
                visible:aclVisible,
                values:_.chain( this.aclRoles )
                    .map((aclRole)=>{
                        return {id:aclRole.name,name:aclRole.label}
                    })
                    .value()

            },{
                model:'timezone',
                type: "select",
                label: "Часовой пояс",
                required: false,
                values:_.chain( this.timezones )
                .map((timezone)=>{
                    return {id:timezone,name:timezone}
                })
                .value()
            },{
                model:'server_id',
                type: "select",
                label: "Сервер",
                required: true,
                values:_.chain( this.servers )
                .map((server)=>{
                    return {id:server._id,name:server.name}
                })
                .value(),
                visible:aclVisible
            },{
                model:'node_id',
                type:'autocomplete',
                label:'Нода',
                multiple:false,
                placeholder:'Выберите ноду',
                visible:aclVisible,
                apollo:{
                    query:gql`
                        query NodesAutocomplete($pagination:PaginationOptions){
                            nodes{
                                list(pagination:$pagination){
                                    rows{
                                        name _id
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
                        return _.chain(data.nodes.list.rows)
                        .map((m)=>{
                            return {id:m._id,label:m.name};
                        })
                        .value();
                    }
                }
            }
        ]
    };
    if(!_.isEmpty(this.usersDataSchemas)){
        result.fields.push({
            model:'data',
            schema: this.usersDataSchemas,
            type:'object',
            visible:aclVisible,
            default(){
                return {};
            }
        })
    }
    return result;
}

const MODULE_NAME = 'users';
const MODULE_PATH = `/${MODULE_NAME}`;

async function preload(){
    let usersDataSchemas = await import(/* webpackIgnore: true */'./usersDataSchemas.js');
    this.usersDataSchemas = usersDataSchemas.default;
}

export default [
    {
        path: '/login',
        name: 'login',
        component: Login,
        meta: {
            title:'Авторизация',
            breadcrumbs:{
                label:'Авторизация',
                parent:'home'
            }
        },
    },
    {
        path:`${MODULE_PATH}/account`,
        name:'account',
        component:Account,
        meta: {
            title:'Мой аккаунт',
            breadcrumbs:{
                label:'Мой аккаунт',
                parent:'home'
            }
        },
    },
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: SmartGraphqlForm,
        meta: {
            title: 'Создание нового пользователя',
            breadcrumbs: {
                label: 'Создать',
                parent: `${MODULE_NAME}Index`
            }
        },
        props:{
            preload,
            mode:'create',
            schema:vueSchemaFactory,
            gqlRoot: 'users',
            apollo:{
                queries:{
                    create:{
                        query:gql`
                            query {
                                aclRoles{
                                    list{
                                        rows{
                                            _id,name,label
                                        },
                                        total
                                    }
                                }
                                servers{
                                    list{
                                        rows{
                                            _id,name,nodes{
                                                _id name
                                            }
                                        },total
                                    }
                                }
                                users{
                                    timezones
                                }
                            }
                        `,
                        update(data){
                            this.aclRoles = data.aclRoles.list.rows;
                            this.servers = data.servers.list.rows;
                            this.timezones = data.users.timezones;
                        }
                    },
                    validate:{
                        query:gql`
                                query UsersValidate($model:JSONObject!){
                                    users{
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
                            this.validateResult = data.users.validate;
                        }
                    }
                },
                mutations:{
                    create:{
                        mutation:gql`
                        mutation Create($model:JSONObject){
                            users{
                                create(model:$model){
                                    success,message,errors,_id,model
                                }
                            }
                        }
                        `,
                        variables(){
                            let model = EJSON.clone(this.model);
                            delete model._id;
                            return {//TODO
                                model:{
                                    login:model.login,
                                    roleName:model.roleName
                                }
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
        path:`${MODULE_PATH}/update/:_id`,
        name:`${MODULE_NAME}Update`,
        component: GraphqlForm,
        meta: {
            title:async function(){
                await this.apolloLoaded();
                return `Изменение пользователя "${this.model.name}"`;
            },
            breadcrumbs:{
                label:async function(){
                    await this.apolloLoaded();
                    return `Изменение пользователя "${this.model.name}"`;
                },
                parent:'home'
            }
        },
        props:{
            preload,
            mode:'update',
            schema:vueSchemaFactory,
            apollo:{
                queries:{
                    update:{
                        query:gql`
                            query View($_id:String!){
                                aclRoles{
                                    list{
                                        rows{
                                            _id,name,label
                                        },
                                        total
                                    }
                                },
                                users{
                                    view(_id:$_id){
                                        login _id role{_id name} roleName name avatar email server_id timezone node_id data acl
                                    }
                                    timezones
                                },
                                servers{
                                    list{
                                        rows{
                                            _id,name,nodes{
                                                _id name
                                            }
                                        },total
                                    }
                                }
                            }
                        `,
                        variables(){
                            return {
                                _id: this.$route.params._id
                            }
                        },
                        update(data) {
                            this.aclRoles = data.aclRoles.list.rows;
                            this.model = data.users.view;
                            this.servers = data.servers.list.rows;
                            this.timezones = data.users.timezones;
                            return data.users.view;
                        }
                    },
                    validate:{
                        query:gql`
                            query UsersValidate($model:JSONObject!){
                                users{
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
                            this.validateResult = data.users.validate;
                        }
                    }
                },
                mutations:{
                    update:{
                        mutation:gql`
                            mutation Edit ($_id:String!,$model:JSONObject!) {
                                users{
                                    edit(_id:$_id,model:$model){
                                        message,success,errors
                                    }
                                }
                            }
                        `,
                        variables(){
                            return {
                                _id:this.model._id,
                                model:this.graphqlClone(this.model)
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
            title:'Пользователи',
            breadcrumbs:{
                label:'Пользователи',
                parent:'home'
            }
        },
        props:{
            columns: [
                {
                    label:'Логин',field:'login',
                },
                {
                    label:'Имя',field:'name',
                    component:'DynamicLink',
                    componentParams(row){
                        return {
                            to:{name:`${MODULE_NAME}Update`,params:{_id:row._id}},
                            anchor: this.$currentUserId == row._id ? `${row.name} (Текущий)` : row.name
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
                },
                {
                    label:'Действия',
                    field:'_id',
                    components:[
                        {
                            component:'UsersActions',
                            componentParams(model){
                                return {
                                    model:model
                                }
                            }
                        },{
                            component:'RemoveAction',
                            componentParams(model){
                                return {
                                    gqlRoot:'users',
                                    model,
                                    text:`Вы действительно хотите удалить пользователя "${model?.name}" ?`
                                }
                            }
                        }
                    ]
                }
            ],
            query:{
                query:gql`query List($pagination:PaginationOptions!){
                    aclRoles{
                        list{
                            rows{
                                _id,name
                            },
                            total
                        }
                    },
                    users{ 
                        list(pagination:$pagination){
                            rows{
                                login _id role{_id name} roleName name avatar email server_id node{name _id} data acl
                            }
                        }
                    }
                }`,
                update(data){
                    this.aclRoles = data.aclRoles.rows;
                    this.rows = data.users.list.rows;
                    this.totalRecords = data.users.list.total;
                    return data.users.list;
                }
            }
        }
    }
];