import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import _ from 'underscore';
import SmartGraphqlForm from "/client/components/SmartGraphqlForm";
import {createDefaultObject} from "/client/vue-form-generator/utils/schema";
import {FIELD_BUILDER_TYPE} from "../../../../lib/enums";
import CustomQueryFilter from "../../../../lib/CustomQueryFilter";
import ImageFilesPreview from "../../../files/client/components/ImageFilesPreview";
import {graphqlClone} from "../../../../lib/utils";
import EJSON from 'ejson';
import {codemirror, userId} from "/client/vue-form-generator/schemaBoilerplates";

const fragment = `
	_id
	name
	classExpr
	user_id
	viewComponent
	paginationComponent
	rules
	image_file_id
    user{_id name}
    imageFile{_id urls}
    autostart
    acl
`;

function vueSchemaFactory () {
    let serverValues = {};
    _.each(this.servers,/**@param {Servers} server*/(server)=>{
        serverValues[server._id] = server.name;
    });

    let nodeValues = {};
    _.each(this.nodes,/**@param {Nodes} node*/(node)=>{
        nodeValues[node._id] = node.name;
    });

    const operators = ['equal','not_equal','is_null','is_not_null'];

    return {
        theme:'bootstrap',
        fields: [
            {
                model: 'name',
                type: 'input', inputType: 'text',
                required: true, validator: 'required',
                label: 'Имя сервиса'
            },
            {
                model:'autostart',
                type:'switch',
                label:'Автозапуск',
                default:false
            },
            {
                model:'rules',
                label:'Условия автозапуска',
                type: "QueryBuilder",
                styleClasses:'',
                visible(model){
                    return model.autostart;
                },
                filters:[{
                    id:'server_id',
                    field: 'server_id',
                    label: 'Сервер',
                    type: FIELD_BUILDER_TYPE.string.key,
                    operators,
                    input: 'select',
                    values: serverValues
                },{
                    id:'node_id',
                    field: 'node_id',
                    label: 'Нода',
                    type: FIELD_BUILDER_TYPE.string.key,
                    operators,
                    input: 'select',
                    values: nodeValues
                }],
                allow_empty:true,
                allow_invalid:false,
                allow_groups:true,
                default(){
                    return {
                        condition:'AND',
                        rules:[],
                        valid:true
                    }
                }
            },
            {
                ...codemirror(),
                model: 'classExpr',
                required: true, validator: 'required',
                label: 'Класс, расширяющий AbstractService'
            },
            {
                ...userId(),
                label: 'Владелец'
            },
            {
                ...codemirror(),
                model: 'viewComponent',
                validator:undefined,
                label: 'Компонент отображения на странице сервиса',
                visible:false
            },
            {
                ...codemirror(),
                model: 'paginationComponent',
                label: 'Компонент отображения на странице списка сервисов',
                visible:false
            },
            {
                model: 'image_file_id',
                label: 'Иконка',
                type:'uploadFile',
                itemComponent:ImageFilesPreview,
                multiple:false,
                apollo:{
                    query:{
                        query:gql`
                            query ImageFilesView($_id:String!){
                                imageFiles{
                                    view(_id:$_id){
                                        _id
                                        user_id
                                        expires
                                        versions{
                                            original{
                                                name
                                            }
                                        }
                                        url
                                        urls
                                        fileName
                                    }
                                }
                            }
                        `,
                        variables(id){
                            if (!_.isEmpty(id)) {
                                return {
                                    _id:id
                                }
                            }
                        },
                        update(data){
                            if(data&&data.imageFiles&&data.imageFiles.view){
                                return this.items = [data.imageFiles.view];
                            }else
                                this.items = [];
                        }
                    },
                    mutation:{
                        mutation:gql`
                            mutation CreateImageFile($model:JSONObject,$file:Upload){
                                imageFiles{
                                    create(model:$model,file:$file){
                                        _id success message errors model
                                    }
                                }
                            }
                        `,
                        variables(file){
                            return {
                                file:file,
                                model:{}
                            }
                        },
                        update(data){
                            return data.data.imageFiles.create._id;
                        }
                    }
                }
            }
        ]
    }
}

let apollo = {
    queries:{
        create:{
            query:gql`
                query {
                    servers{
                        list{
                            rows{
                                _id,name,nodes{
                                    _id name
                                }
                            },total
                        }
                    }
                    nodes{
                        list{
                            rows{
                                _id name
                            }
                        }
                    }
                }
            `,
            update(data){
                this.servers = data.servers.list.rows;
                this.nodes = data.nodes.list.rows;
            }
        },
        update:{
            query:gql`
                query CustomServicesView($_id:String!){
                    customServices{
                        view(_id:$_id){
                            ${fragment}
                        }
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
                    nodes{
                        list{
                            rows{
                                _id name
                            }
                        }
                    }
                }
            `,
            variables(){
                return {
                    _id: this.$route.params._id
                }
            },
            update(data){
                this.model = data.customServices.view;
                this.servers = data.servers.list.rows;
                this.nodes = data.nodes.list.rows;
            }
        },
        validate:{
            query:gql`
                query CustomServicesValidate($model:JSONObject!){
                    customServices{
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
                this.validateResult = data.customServices.validate;
            }
        }
    },
    mutations:{
        create:{
            mutation:gql`
                mutation CustomServicesCreate($model:JSONObject){
                    customServices{
                        create(model:$model){
                            success,message,errors,_id,model
                        }
                    }
                }
            `,
            variables(){
                let model = EJSON.clone(this.model);
                return {model};
            }
        },
        update:{
            mutation:gql`
                mutation CustomServicesUpdate($_id:String!,$model:JSONObject!){
                    customServices{
                        edit(_id:$_id,model:$model){
                            success,message,errors,_id
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
}

const MODULE_NAME = 'customServices';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: SmartGraphqlForm,
        meta: {
            title: 'Создать новый Пользовательские сервисы',
            breadcrumbs: {
                label: 'Создать новый',
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'create',
            schema: vueSchemaFactory,
            apollo,
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
                return `Изменить Пользовательские сервисы "${this.model.name}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Изменить Пользовательские сервисы "${this.model.name}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'update',
            schema: vueSchemaFactory,
            apollo,
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
            breadcrumbs: {
                label: 'Пользовательские сервисы',
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
                    label: 'Имя сервиса', field: 'name',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {name: `${MODULE_NAME}Update`, params: {_id: row._id}},
                            anchor: row.name,
                            img:row.imageFile?.urls?.small
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
                    label: 'Владелец', field: 'user',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {
                                name: `usersUpdate`,
                                params: {
                                    _id: row.user_id
                                }
                            },
                            anchor: row.user?.name || '<Неизвестно>',
                            img: row.user?.avatar
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
                    label:'Действия',
                    field:'acl',
                    components:[
                        {
                            component:'RemoveAction',
                            componentParams(model){
                                return {
                                    gqlRoot:'customServices',
                                    model,
                                    text:`Вы действительно хотите удалить пользовательский сервис "${model.name}" ?`
                                }
                            }
                        }
                    ]
                }
            ],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        customServices{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.customServices.list.rows;
                    this.totalRecords = data.customServices.list.total;
                }
            }
        }
    }
];