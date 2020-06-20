import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import GeneratorItemsForm from "../components/GeneratorItemsForm";
import {cloneDeep} from 'lodash';
import _ from 'underscore';

const fragment = `
_id
name
template_id
template{
    _id name
}
templateData
acl
`;

const MODULE_NAME = 'generatorItems';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
    path: `${MODULE_PATH}/create`,
    name: `${MODULE_NAME}Create`,
    component: GeneratorItemsForm,
    meta: {
        title:'Создать новый Заполненные шаблоны генератора',
        breadcrumbs:{
            label:'Создать новый',
            parent:`${MODULE_NAME}Index`
        }
    },
    props:{
        mode:'create',
    }
},{
    path:`${MODULE_PATH}/update/:_id`,
    name:`${MODULE_NAME}Update`,
    component: GeneratorItemsForm,
    meta: {
        title:async function(){
            await this.apolloLoaded();
            return `Изменить Заполненные шаблоны генератора "${this.model.name}"`;
        },
        breadcrumbs:{
            label:async function(){
                await this.apolloLoaded();
                return `Изменить Заполненные шаблоны генератора "${this.model.name}"`;
            },
            parent:`${MODULE_NAME}Index`
        }
    },
    props:{
        mode:'update'
    }
},{
    path:`${MODULE_PATH}`,
    name:`${MODULE_NAME}Index`,
    component:GraphqlPagination,
    meta: {
        title:'Заполненные шаблоны генератора',
        breadcrumbs:{
            label:'Заполненные шаблоны генератора',
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
                    componentParams:function(row) {
                        return {
                            to: {name: `${MODULE_NAME}Update`, params: {_id: row._id}},
                            anchor: row.name
                        }
                    },
                    filterOptions:{
                          enabled: true, // enable filter for this column
                          placeholder: 'Поиск..', // placeholder for filter input
                          filterValue: undefined, // initial populated value for this filter
                          trigger: 'enter', //only trigger on enter not on keyup
                          transform($input){
                              return String($input).length>0 ? new RegExp($input,'i'):undefined;
                          }
                    }
                },{
                    label:'Шаблон',field:'template_id',
                    component:'DynamicLink',
                    componentParams:function(row){
                        return {
                            to:{
                                name:`generatorTemplatesUpdate`,
                                params:{_id:row.template_id}
                            },
                            anchor: row.template?row.template.name:'?'
                        }
                    }
                }
            
                        
        ],
        query:{
            query:gql`
                query List($pagination:PaginationOptions!){
                    generatorItems{
                        list(pagination:$pagination){
                            rows{
                                ${fragment}
                            },
                            total
                        }
                    }
                }`,
            variables () {
                let variables = cloneDeep({pagination:this.serverParams});
                if(_.isEmpty(variables.pagination.sort)) {
                    variables.pagination.sort = {created:-1};
                }
                return variables;
            },
            update(data){
                this.rows = data.generatorItems.list.rows;
                this.totalRecords = data.generatorItems.list.total;
            }
        }
    }
}
];