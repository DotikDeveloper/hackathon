import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import _ from 'underscore';
import {createDefaultObject} from "/client/vue-form-generator/utils/schema";
import VMCodesForm from "../components/VMCodesForm";
import {userId} from "../../../../client/vue-form-generator/schemaBoilerplates";

const fragment = `
	_id
	expression
	transpiledExpression
	useCustomScope
	scopeExpression
	useCustomCtx
	ctxExpression
	created
	meta{
		user_id
		project_id
		menu_id
		tag
	}
	check{
		result
		date
	}
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
        <div class="row">
            <div class="col">
            <vfg-field for="expression"/>
            </div>
            <div class="col">
            <vfg-field for="transpiledExpression"/>
            </div>
        </div>
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
                model: 'expression',
                required: true, validator: 'required',
                label: 'Код',
                ...codemirror(),
            },
            {
                model: 'transpiledExpression',
                label: 'Модифицированный код',
                ...codemirror(),
                validator:undefined
            },
            {
                model: 'useCustomScope',
                type: 'switch',
                label: 'Использовать специальный scope',
                default:false
            },
            {
                model: 'scopeExpression',
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
                label: 'Код, возвращающий специальный контекст',
                visible(model){
                    return model.useCustomCtx;
                },
                ...codemirror(),
                required:true,validator:'required'
            },
            {
                model: 'meta',
                type: 'object',
                schema: {
                    fields: [
                        {
                            ...userId(),
                            label: 'Пользователь'
                        },
                        {
                            model: 'project_id',
                            type: 'input', inputType: 'text',
                            label: 'Проект'
                        },
                        {
                            model: 'menu_id',
                            type: 'input', inputType: 'text',
                            label: 'Меню'
                        },
                        {
                            model: 'tag',
                            type: 'input', inputType: 'text',
                            label: 'Тэг'
                        }
                    ]
                }
            },
            {
                model: 'check',
                type: 'object',
                schema: {
                    fields: [
                        {
                            model: 'result',
                            type: 'input', inputType: 'text',
                            label: 'Результат'
                        }
                    ]
                }
            }
        ]
    }
}

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

const MODULE_NAME = 'vmCodes';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: VMCodesForm,
        meta: {
            title: 'Создать новый Системный код',
            breadcrumbs: {
                label: 'Создать новый',
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'create',
            schema: vueSchemaFactory,
            gqlRoot: 'vmCodes',
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
                return createDefaultObject (this.computedSchema, {});
            },
            buttons:buttonsFn
        }
    }, {
        path: `${MODULE_PATH}/update/:_id`,
        name: `${MODULE_NAME}Update`,
        component: VMCodesForm,
        meta: {
            title: async function () {
                await this.apolloLoaded ();
                return `Изменить Системный код "${this.model.name}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Изменить Системный код "${this.model.name}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'update',
            schema: vueSchemaFactory,
            gqlRoot: 'vmCodes',
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
            title:'Системный код',
            breadcrumbs: {
                label: 'Системный код',
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
                    label: 'Код', field: 'expression',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {name: `${MODULE_NAME}Update`, params: {_id: row._id}},
                            anchor: row.expression
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
                    label: 'Код, возвращающий scope', field: 'scopeExpression',
                    filterOptions: {
                        enabled: true, // enable filter for this column
                        placeholder: 'Поиск..', // placeholder for filter input
                        filterValue: undefined, // initial populated value for this filter
                        trigger: 'enter', //only trigger on enter not on keyup
                        transform ($input) {
                            return String ($input).length > 0 ? new RegExp ($input, 'i') : undefined;
                        }
                    },
                    formatFn: function (value) {
                        return String (value);
                    }
                },
                {
                    label: 'Модифицированный код', field: 'transpiledExpression',
                    filterOptions: {
                        enabled: true, // enable filter for this column
                        placeholder: 'Поиск..', // placeholder for filter input
                        filterValue: undefined, // initial populated value for this filter
                        trigger: 'enter', //only trigger on enter not on keyup
                        transform ($input) {
                            return String ($input).length > 0 ? new RegExp ($input, 'i') : undefined;
                        }
                    },
                    formatFn: function (value) {
                        return String (value);
                    }
                }
            ],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        vmCodes{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.vmCodes.list.rows;
                    this.totalRecords = data.vmCodes.list.total;
                }
            }
        }
    }
];