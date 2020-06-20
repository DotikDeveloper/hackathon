import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import _ from 'underscore';
import SmartGraphqlForm from "/client/components/SmartGraphqlForm";
import {createDefaultObject} from "/client/vue-form-generator/utils/schema";
import {NodeInstanceStates} from "../../enums";
import moment from 'moment';

const fragment = `
	_id
	server_id
	node_id
	meta
	base_url
	state
	stateChanged
server{_id name}
node{_id name}
acl
`;

function vueSchemaFactory () {
    return {
        fields: [
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
                model: 'base_url',
                type: 'input', inputType: 'text',
                label: 'URL'
            },
            {
                model: 'state',
                type: 'input', inputType: 'text',
                label: 'Состояние'
            },
            {
                model: 'stateChanged',
                type: 'input', inputType: 'text',
                label: 'Время изменения состояния'
            }
        ]
    }
}

const MODULE_NAME = 'nodeInstances';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: SmartGraphqlForm,
        meta: {
            title: 'Создать новый Инстансы нод',
            breadcrumbs: {
                label: 'Создать новый',
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'create',
            schema: vueSchemaFactory,
            gqlRoot: 'nodeInstances',
            fragment,
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
                return `Изменить Инстансы нод "${this.model.name}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Изменить Инстансы нод "${this.model.name}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'update',
            schema: vueSchemaFactory,
            gqlRoot: 'nodeInstances',
            fragment,
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
            title: 'Инстансы нод',
            breadcrumbs: {
                label: 'Инстансы нод',
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
                    label: 'Сервер', field: 'server',
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
                }, {
                    label: 'Нода', field: 'node',
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
                }, {
                    label: 'Состояние', field: 'state',
                    formatFn: function (state) {
                        let hState = NodeInstanceStates[state]?.label || NodeInstanceStates.UNKNOWN.label;
                        if (!this.stateChanged)
                            return hState;
                        return `${hState} ${moment (this.stateChanged).fromNow ()}`;
                    }
                }
            ],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        nodeInstances{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.nodeInstances.list.rows;
                    this.totalRecords = data.nodeInstances.list.total;
                }
            }
        }
    }
];