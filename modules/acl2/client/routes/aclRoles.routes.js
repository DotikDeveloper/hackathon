import GraphqlForm from "/client/components/GraphqlForm";
import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import _ from 'underscore';

const vueSchemaFactory = function(){
    const schema = {
        fields: [
            {
                model: "name",
                type: "input",
                inputType: "text",
                label: "Системное имя",
                readonly: false,disabled: false,
            }, {
                model:'label',
                type: "input",
                inputType: "text",
                label:'Отображаемое имя',
                default:null,
            },{
                model:'resources',
                type:'object',
                schema:{
                    fields:_.map(this?.aclRoles?.resources,(resource)=>{
                        return {
                            model:resource.name,
                            label:resource.label,
                            type:'object',
                            schema:{
                                type:'object',
                                theme:'bootstrap',
                                template:`
                                <div style="max-width:100%;">
<div class="row">
    <div class="col">
        <vfg-field for="privateFields"/>
    </div>
    <div class="col">
        <vfg-field for="protectedFields"/>
    </div>
</div>
                                
                                `,
                                fields:[{
                                    model:'privateFields',
                                    label:'Приватные поля (нечитаемые)',
                                    type:'autocomplete',
                                    multiple:true,
                                    apollo:{
                                        query:gql`
                                            query AclFiltersAutocomplete($pagination:PaginationOptions){
                                                aclRoles{
                                                    resourceFields(pagination:$pagination){
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
                                            filters.resource = {$in:[resource.name]}
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
                                            return _.chain(data.aclRoles.resourceFields.rows)
                                            .map((m)=>{
                                                return {id:m.name,label:m.label};
                                            })
                                            .value();
                                        }
                                    }
                                },{
                                    model:'protectedFields',
                                    label:'Защищенные поля (пользователь может читать, но не может изменить)',
                                    type:'autocomplete',
                                    multiple:true,
                                    apollo:{
                                        query:gql`
                                            query AclFiltersAutocomplete($pagination:PaginationOptions){
                                                aclRoles{
                                                    resourceFields(pagination:$pagination){
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
                                            filters.resource = {$in:[resource.name]}
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
                                            return _.chain(data.aclRoles.resourceFields.rows)
                                            .map((m)=>{
                                                return {id:m.name,label:m.label};
                                            })
                                            .value();
                                        }
                                    }
                                }]
                            }
                        }
                    })
                }
            }
        ],
        formOptions: {
            validateAfterLoad: false,
            validateAfterChanged: true,
            //validateAsync: true,
            validateDebounceTime:0
        }
    };

    return  schema;
};

const MODULE_NAME = 'aclRoles';
const MODULE_PATH = `/${MODULE_NAME}`;

export default [
    /*{
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: GraphqlForm,
        props:{
            mode:'create',
            schema:vueSchemaFactory,
            apollo:{
                queries:{
                    create:{
                        query:gql`
                            query Create($_id: String!) {
                                Acl{
                                    descriptions
                                }
                            }
                        `,
                        update(data){
                            return data.Acl;
                        }
                    }
                },
                mutations:{
                    create:{
                        mutation:gql`
                            mutation Create ($_id:String!,$name:String!,$label:String!,$resources:JSONObject!) {
                                Acl{
                                    create(_id:$_id,name:$name,label:$label,resources:$resources){
                                        message,success,errors
                                    }
                                }
                            }
                        `,
                        variables(){
                            let model = EJSON.clone(this.model);
                            delete model._id;
                            model.date = new Date();
                            return {model:model};
                        }
                    }
                }
            }
        }
    },*/
    {
        path:`${MODULE_PATH}/update/:_id`,
        name:`${MODULE_NAME}Update`,
        component: GraphqlForm,
        props:{
            mode:'update',
            schema:vueSchemaFactory,
            apollo:{
                queries:{
                    update:{
                        query:gql`query AclRolesView($_id: String!){
                                aclRoles{
                                    view(_id: $_id){
                                        _id,name,label,resources
                                    }
                                    resources{
                                        name label
                                    }
                                }
                            }`,
                        variables(){
                            return {
                                _id: this.$route.params._id
                            }
                        },
                        update(data){
                            this.model = data.aclRoles.view;
                            this.aclRoles = data.aclRoles;
                        }
                    }
                },
                mutations:{
                    update:{
                        mutation:gql`
                            mutation AclRolesEdit ($_id:String!,$model:JSONObject!) {
                                aclRoles{
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
        },
        meta:{
            breadcrumbs:{
                label(){
                    return `Изменить роль "${this.model.label}"`
                },
                parent:`${MODULE_NAME}Index`
            }
        }
    },
    {
        path:`${MODULE_PATH}`,
        name:`${MODULE_NAME}Index`,
        component:GraphqlPagination,
        meta: {
            breadcrumbs:{
                label:'Роли',
                parent:'home'
            }
        },
        props:{
            columns: [
                {
                    label: 'id',
                    field:'_id',
                },
                {
                    label:'name',field:'name',
                    filterOptions: {
                        enabled: true, // enable filter for this column
                        placeholder: 'Поиск..', // placeholder for filter input
                        filterValue: undefined, // initial populated value for this filter
                        //filterDropdownItems: [], // dropdown (with selected values) instead of text input
                        //filterFn: this.columnFilterFn, //custom filter function that
                        trigger: 'enter', //only trigger on enter not on keyup
                        transform($input){
                            return String($input).length>0 ? $input:undefined;
                        }
                    },
                    component:'DynamicLink',
                    componentParams(row){
                        return {
                            to:{name:`${MODULE_NAME}Update`,params:{_id:row._id}},
                            anchor:row.label
                        }
                    },
                },
            ],
            query:{
                query:gql`query AclRolesList($pagination:PaginationOptions!){
                    aclRoles{
                        list(pagination:$pagination){
                            rows{
                                _id,name,label,acl
                            },
                            total
                        }
                    }
                }`,
                update(data){
                    this.rows = data.aclRoles.list.rows;
                    this.totalRecords = data.aclRoles.list.total;
                }
            }
        }
    }
]