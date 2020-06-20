import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import {graphqlClone} from "../../../../lib/utils";
import AclRulesForm from "../components/AclRulesForm";

const fragment = `_id
                name
                roles
                resources
                actions
                mode
                rules
                conditionExpr
                acl
                user_id
                user{name _id}
                `;

const MODULE_NAME = 'aclRules';
const MODULE_PATH = `/${MODULE_NAME}`;
const MODULE_LABEL = `Правила`;

export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: AclRulesForm,
        meta: {
            title:'Создать новый',
            breadcrumbs:{
                label:'Фильтры ролей',
                parent:'home'
            }
        },
        props:{
            mode:'create',
            apollo:{
                queries:{
                    create:null
                },
                mutations:{
                    create:{
                        mutation:gql`
                            mutation AclRulesCreate($model:JSONObject!){
                                aclRules{
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
        component: AclRulesForm,
        meta: {
            title:async function(){
                await this.apolloLoaded();
                return `Изменить фильтр доступа "${this.model.name}"`;
            },
            breadcrumbs:{
                label:`${MODULE_LABEL}`,
                parent:'home'
            }
        },
        props:{
            mode:'update',
            apollo:{
                queries:{
                    update:{
                        query:gql`
                            query AclRulesView($_id:String!){
                                aclRules{
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
                            this.model = data.aclRules.view;
                        }
                    }
                },
                mutations:{
                    update:{
                        mutation:gql`
                            mutation Edit ($_id:String!,$model:JSONObject!) {
                                aclRules{
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
            title:'Правила доступа',
            breadcrumbs:{
                label:`Правила доступа`,
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
                    label:'Роли',field:'roles',
                    // eslint-disable-next-line no-unused-vars
                    formatFn(value){
                        return (this.roles||[]).join(', ');
                    }
                },{
                    label:'Действия',field:'actions',
                    // eslint-disable-next-line no-unused-vars
                    formatFn(value){
                        return value.join(', ');
                    }
                },{
                    label:'Действия',
                    field:'acl',
                    components:[
                        {
                            component:'RemoveAction',
                            componentParams(model){
                                return {
                                    gqlRoot:'aclRules',
                                    model,
                                    text:`Вы действительно хотите удалить правило "${model.name}" ?`
                                }
                            }
                        }
                    ]
                }
            ],
            query:{
                query:gql(`
                    query List($pagination:PaginationOptions!){
                        aclRules{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                }`),
                update(data){
                    this.rows = data.aclRules.list.rows;
                    this.totalRecords = data.aclRules.list.total;
                }
            }
        }
    }
];