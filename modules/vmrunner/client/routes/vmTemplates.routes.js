import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import _ from 'underscore';
import {createDefaultObject} from "/client/vue-form-generator/utils/schema";
import VMTemplatesForm from "../components/VMTemplatesForm";
import {userId} from "../../../../client/vue-form-generator/schemaBoilerplates";

const fragment = `
	_id
	name
	user_id
	expression
	useCustomScope
	scopeExpression
	created
	useCustomCtx
	ctxExpression
	serverOptions{
		useCustom
		server_id
		node_name
	}
    user{_id name}
    server{_id name}
    acl
`;

function vueSchemaFactory () {
    let codemirror = function () {
        return {
            type: 'codemirror',
            // eslint-disable-next-line no-unused-vars
            validator: function (value, field, model) {
                if (_.isEmpty (value)) {
                    return ['Поле обязательно'];
                }
                return [];
            },
            codeMirrorOptions: {
                lineNumbers: true,
                mode: 'javascript',
                gutters: ["CodeMirror-lint-markers"],
                lint: {
                    esversion: 6
                },
                resize: {
                    minWidth: 200,               //Minimum size of the CodeMirror editor.
                    minHeight: 100,
                    resizableWidth: true,        //Which direction the editor can be resized (default: both width and height).
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
        <vfg-field for="name"/>
        <vfg-field for="user_id"/>
        <vfg-field for="expression"/>
        <vfg-field for="useCustomScope"/>
        <vfg-field for="scopeExpression"/>
        <vfg-field for="useCustomCtx"/>
        <vfg-field for="ctxExpression"/>
        <vfg-field for="serverOptions"/>
        
        <vfg-field for="successButton"/>
        <vfg-field for="cancelButton"/>
        <vfg-field for="runButton"/>
    </div>
    <div class="col">
        <textarea id="resultArea" style="width:100%;height:100%;" readonly></textarea>
    </div>
</div>
</div>
`,
        fields: [
            {
                model: 'name',
                type: 'input', inputType: 'text',
                required: true, validator: 'required',
                label: 'Имя'
            },
            {
                ...userId(),
                label: 'Пользователь'
            },
            {
                model: 'expression',
                label: 'Код',
                ...codemirror(),
                required:true,validator:'required'
            },
            {
                model: 'useCustomScope',
                type: 'switch',
                label: 'Использовать специальный scope',
                default:false
            },
            {
                model: 'scopeExpression',
                type: 'input', inputType: 'text',
                label: 'Код, возвращающий scope',
                visible(model){
                    return model.useCustomScope;
                },
                ...codemirror(),
                required:true,validator:'required'
            },
            {
                model: 'useCustomCtx',
                type: 'switch',
                label: 'Использовать специальный контекст',
                default:false
            },
            {
                model: 'ctxExpression',
                type: 'input', inputType: 'text',
                label: 'Код, возвращающий специальный контекст',
                visible(model){
                    return model.useCustomCtx;
                },
                ...codemirror(),
                required:true,validator:'required'
            },
            {
                model: 'serverOptions',
                type: 'object',
                schema: {
                    fields: [
                        {
                            model: 'useCustom',
                            type: 'switch',
                            label: 'Использовать статический сервер'
                        },
                        {
                            model: 'server_id',
                            type:'autocomplete',
                            label: 'Сервер',
                            visible(model){
                                return model.useCustom;
                            },
                            multiple:false,
                            placeholder:'Выберите сервер...',
                            apollo:{
                                query:gql`
                                    query ServersAutocomplete($pagination:PaginationOptions){
                                        servers{
                                            list(pagination:$pagination){
                                                rows{
                                                    name _id
                                                }
                                            }
                                        }
                                    }
                                `,
                                variables(options){
                                    let filters = {};
                                    if(options.term){
                                        filters.name = new RegExp(options.term,'i');
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
                                    return _.chain(data.servers.list.rows)
                                    .map((m)=>{
                                        return {id:m._id,label:m.name};
                                    })
                                    .value();
                                }
                            },
                            validator(){
                                return [];
                            }
                        },
                        {
                            model: 'node_name',
                            type:'autocomplete',
                            label: 'Нода',
                            visible(model){
                                return model.useCustom;
                            },
                            multiple:false,
                            placeholder:'Выберите ноду...',
                            apollo:{
                                query:gql`
                                    query NodesAutocomplete{
                                        nodes{
                                            list{
                                                rows{
                                                    name _id
                                                }
                                            }
                                        }
                                    }
                                `,
                                variables (options){
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
                                    return _.chain(data?.nodes?.list?.rows)
                                    .map((node)=>{
                                        return {id:node._id,label:node.name};
                                    })
                                    .value();
                                }
                            },
                        }
                    ]
                }
            }
        ]
    }
}

const MODULE_NAME = 'vmTemplates';
const MODULE_PATH = `/${MODULE_NAME}`;

function buttonsFn(){
    let defaultButtons = this.buttonsDefault();
    return [
        ...defaultButtons,
        {
            "name":'runButton',
            "type": "submit",
            "buttonText": "Запустить",
            "onSubmit": _.bind(this.doRun, this),
            styleClasses: ' col-',
            fieldClasses: 'btn btn-outline-info'
        }
    ]
}
export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: VMTemplatesForm,
        meta: {
            title: 'Создать новый Пользовательский код',
            breadcrumbs: {
                label: 'Создать новый',
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'create',
            schema: vueSchemaFactory,
            gqlRoot: 'vmTemplates',
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
                return createDefaultObject.apply(this,[this.computedSchema, {}]);
            },
            buttons:buttonsFn
        }
    }, {
        path: `${MODULE_PATH}/update/:_id`,
        name: `${MODULE_NAME}Update`,
        component: VMTemplatesForm,
        meta: {
            title: async function () {
                await this.apolloLoaded ();
                return `Изменить Пользовательский код "${this.model.name}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Изменить Пользовательский код "${this.model.name}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'update',
            schema: vueSchemaFactory,
            gqlRoot: 'vmTemplates',
            fragment: fragment,
            events: {
                submit () {
                    this.$router.push ({name: `${MODULE_NAME}Index`});
                },
                cancel () {
                    this.$router.push ({name: `${MODULE_NAME}Index`});
                }
            },
            buttons:buttonsFn
        }
    }, {
        path: `${MODULE_PATH}`,
        name: `${MODULE_NAME}Index`,
        component: GraphqlPagination,
        meta: {
            title:'Пользовательский код',
            breadcrumbs: {
                label: 'Пользовательский код',
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
                },
                {
                    label: 'Пользователь', field: 'user_id',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {name: `usersUpdate`, params: {_id: row.user_id}},
                            anchor: row.user ? row.user.name : '?'
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
                                    gqlRoot:'vmTemplates',
                                    model,
                                    text:`Вы действительно хотите удалить пользовательский код "${model.name}" ?`
                                }
                            }
                        }
                    ]
                }
            ],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        vmTemplates{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.vmTemplates.list.rows;
                    this.totalRecords = data.vmTemplates.list.total;
                }
            }
        }
    }
];