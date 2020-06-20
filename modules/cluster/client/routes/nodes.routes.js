import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import _ from 'underscore';
import SmartGraphqlForm from "/client/components/SmartGraphqlForm";
import {createDefaultObject} from "/client/vue-form-generator/utils/schema";
import {codemirror} from "/client/vue-form-generator/schemaBoilerplates";

const fragment = `
	_id
	name
	baseUrlExpr
	port
	viewComponent
	paginationComponent
    servers{_id name}
    acl
`;

function vueSchemaFactory () {
    return {
        fields: [
            {
                model: 'name',
                type: 'input', inputType: 'text',
                required: true, validator: 'required',
                label: 'Имя ноды'
            },
            {
                ...codemirror(),
                model: 'baseUrlExpr',
                required: true, validator: 'required',
                label: 'Код, возвращающий базовый url'
            },
            {
                model: 'port',
                type: 'input', inputType: 'number',
                required: false, validator: 'required',
                label: 'Порт инстанса'
            },
            {
                ...codemirror(),
                model: 'viewComponent',
                label: 'Компонент отображения на странице ноды'
            },
            {
                ...codemirror(),
                model: 'paginationComponent',
                label: 'Компонент отображения на странице списка нод'
            }
        ]
    }
}

const MODULE_NAME = 'nodes';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: SmartGraphqlForm,
        meta: {
            title: 'Создать новый Ноды',
            breadcrumbs: {
                label: 'Создать новый',
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'create',
            schema: vueSchemaFactory,
            gqlRoot: 'nodes',
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
                return `Изменить Ноды "${this.model.name}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Изменить Ноды "${this.model.name}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'update',
            schema: vueSchemaFactory,
            gqlRoot: 'nodes',
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
            title:'Ноды',
            breadcrumbs: {
                label: 'Ноды',
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
                    label: 'Имя ноды', field: 'name',
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
                    },
                },

                {
                    label: 'Порт', field: 'port'
                },

                {
                    label: 'Серверы', field: 'servers',
                    component: 'DynamicLinks',
                    componentParams: function (row) {
                        return {
                            data: _.map (row.servers, (server) => {
                                return {
                                    to: {
                                        name: `serversUpdate`,
                                        params: {
                                            _id: server._id
                                        }
                                    },
                                    anchor: server.name
                                }
                            })
                        }
                    }
                }
            ],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        nodes{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.nodes.list.rows;
                    this.totalRecords = data.nodes.list.total;
                }
            }
        }
    }
];