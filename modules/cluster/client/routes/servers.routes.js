import GraphqlForm from "/client/components/GraphqlForm";
import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import {graphqlClone} from "../../../../lib/utils";
import _ from 'underscore';

const fragment = `
    _id
    name
    isMaster
    isDefault
    available
    free
    total
    node_ids
    defaultNodeId
    nodes{
        _id name
    }
    defaultNode{
        _id name
    }
    acl
`;

function vueSchemaFactory(){
    return {
        fields:[
            {
                model: "name",
                type: "input",
                inputType: "text",
                label: "Имя",
                readonly: false,disabled: false
            },{
                model: "isMaster",
                type: "checkbox",
                label: "Мастер",
                readonly: false,disabled: false
            },{
                model: "isDefault",
                type: "checkbox",
                label: "Сервер по умолчанию",
                readonly: false,disabled: false
            },{
                model:'node_ids',
                type:'autocomplete',
                label:'Ноды',
                multiple:true,
                placeholder:'Выберите ноды, запускаемые на этом сервере...',
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
            },{
                model:'defaultNodeId',
                type:'autocomplete',
                label:'Нода по умолчанию',
                multiple:false,
                placeholder:'Нода по умолчанию',
                apollo:{
                    query:gql`
                        query NodesAutocomplete($nodesPagination:PaginationOptions){
                            nodes{
                                list(pagination:$nodesPagination){
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
                            nodesPagination:{
                                filters:filters,
                                page:page,
                                perPage:perPage,
                                sort:{
                                    name:1
                                }
                            }
                        }
                    },
                    update:(data)=>{
                        return _.chain(data.nodes.list.rows)
                        .filter((node)=>{
                            return this.model&&this.model.node_ids&&this.model.node_ids.indexOf(node._id)>-1;
                        })
                        .map((m)=>{
                            return {id:m._id,label:m.name};
                        })
                        .value();
                    }
                }
            }
        ]
    }
}

const MODULE_NAME = 'servers';
const MODULE_PATH = `/${MODULE_NAME}`;

export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: GraphqlForm,
        meta:{
            title:'Создать новый сервер',
            breadcrumbs:{
                label:'Новый',
                parent: `${MODULE_NAME}Index`
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
                            mutation Create($model:JSONObject!){
                                servers{
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
            }
        }
    },{
        path:`${MODULE_PATH}/update/:_id`,
        name:`${MODULE_NAME}Update`,
        component: GraphqlForm,
        meta: {
            title: async function () {
                await this.apolloLoaded ();
                return `Изменить сервер "${this.model.name}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Изменить сервер "${this.model.name}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props:{
            mode:'update',
            schema:vueSchemaFactory,
            apollo:{
                queries:{
                    update:{
                        query:gql`
                            query View($_id:String!){
                                servers{
                                    view(_id:$_id){
                                        ${fragment}
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
                            this.model = data.servers.view;
                            return data.servers;
                        }
                    }
                },
                mutations:{
                    update:{
                        mutation:gql`
                            mutation Edit ($_id:String!,$model:JSONObject!) {
                                servers{
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
    },{
        path:`${MODULE_PATH}`,
        name:`${MODULE_NAME}Index`,
        component:GraphqlPagination,
        meta: {
            title:'Серверы',
            breadcrumbs:{
                label:'Серверы',
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
                        //transform($input){
                        //    return String($input).length>0 ? $input:undefined;
                        //}
                    },
                },{
                    label:'Ноды',field:'nodes',
                    component:'DynamicLinks',
                    componentParams(row){
                        return {
                            data:_.chain(row.nodes)
                            .map((node)=>{
                                return {
                                    to:{name:`nodesUpdate`,params:{_id:node._id}},
                                    anchor: node.name
                                }
                            })

                        }
                    },
                },{
                    label:'Диск',field:'free',
                    formatFn(){
                        return [this.available,this.free,this.total].join(' ');
                    }
                }
            ],
            query:{
                query:gql`query List($pagination:PaginationOptions!){
                    servers{
                        list(pagination:$pagination){
                            rows{
                                ${fragment}
                            }
                        }
                    }
                }`,
                update(data){
                    this.rows = data.servers.list.rows;
                    this.totalRecords = data.servers.list.total;
                    return data.servers.list;
                }
            }
        }
    }
];