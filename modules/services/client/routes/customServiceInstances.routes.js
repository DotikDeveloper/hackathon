import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import _ from 'underscore';
import SmartGraphqlForm from "/client/components/SmartGraphqlForm";
import {createDefaultObject} from "/client/vue-form-generator/utils/schema";
import {CustomServiceStates} from "../../enums";

const fragment = `
	_id
	custom_service_id
	server_id
	node_id
	meta
	state
    server{_id name}
    node{_id name}
    customService{_id name}
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
        fields: [
            {
                model: 'custom_service_id',
                type: 'input', inputType: 'text',
                required: true, validator: 'required',
                label: 'Пользовательский сервис'
            },
            {
                model: 'server_id',
                type: 'input', inputType: 'text',
                required: true, validator: 'required',
                label: 'Сервер'
            },
            {
                model: 'node_id',
                type: 'input', inputType: 'text',
                required: true, validator: 'required',
                label: 'Нода'
            },
            {
                model: 'meta',
                type: 'object',
                schema: {
                    fields: []
                }
            },
            {
                model: 'state',
                type: 'input', inputType: 'text',
                label: 'Состояние'
            }
        ]
    }
}

const MODULE_NAME = 'customServiceInstances';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: SmartGraphqlForm,
        meta: {
            title: 'Создать новый Инстанс пользовательских сервисов',
            breadcrumbs: {
                label: 'Создать новый',
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'create',
            schema: vueSchemaFactory,
            gqlRoot: 'customServiceInstances',
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
                return `Изменить Инстансы пользовательских сервисов "${this.model.name}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Изменить Инстансы пользовательских сервисов "${this.model.name}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'update',
            schema: vueSchemaFactory,
            gqlRoot: 'customServiceInstances',
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
            breadcrumbs: {
                label: 'Инстансы пользовательских сервисов',
                parent: 'home'
            }
        },
        props: {
            columns: [
                {
                    label: 'Пользовательский сервис', field: 'customService',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {
                                name: `customServicesUpdate`,
                                params: {
                                    _id: row.custom_service_id
                                }
                            },
                            anchor: row.customService?.name || '<Неизвестно>',
                            img: row.customService?.imageFile?.urls.small
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
                    label:'Сервер',field:'server',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {
                                name: `serversUpdate`,
                                params: {
                                    _id: row.server_id
                                }
                            },
                            anchor: row.server?.name || '<Неизвестно>'
                        }
                    }
                },{
                    label:'Нода',field:'node',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {
                                name: `nodesUpdate`,
                                params: {
                                    _id: row.node_id
                                }
                            },
                            anchor: row.node?.name || '<Неизвестно>'
                        }
                    }
                },{
                    label:'Состояние',field:'state',
                    formatFn: function (state) {
                        return CustomServiceStates[state]?CustomServiceStates[state].label:'Неизвестно';
                    }
                },{
                    label:'Метаинформация',field:'meta',
                    component: 'VueJsonPretty',
                    componentParams: function (row) {
                        return {
                            data: row.meta
                        }
                    }
                }
            ],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        customServiceInstances{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.customServiceInstances.list.rows;
                    this.totalRecords = data.customServiceInstances.list.total;
                }
            }
        }
    }
];