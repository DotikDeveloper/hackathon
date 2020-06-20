import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import SmartGraphqlForm from "/client/components/SmartGraphqlForm";
import {formatRuDateTime} from "../../../../lib/utils";
import {userId} from "../../../../client/vue-form-generator/schemaBoilerplates";

const fragment = `
	_id
	message
	tag
	level
	dataString
	created
	meta{
		user_id
		server_id
		node
	}
	acl
`;

function vueSchemaFactory () {
    return {
        fields: [
            {
                model: 'message',
                type: 'input', inputType: 'text',
                label: 'Сообщение'
            },
            {
                model: 'tag',
                type: 'input', inputType: 'text',
                label: 'Тэг'
            },
            {
                model: 'level',
                type: 'input', inputType: 'text',
                label: 'Уровень'
            },
            {
                model: 'dataString',
                type: 'input', inputType: 'text',
                label: 'Дополнительное инфо'
            },
            {
                model: 'created',
                label: 'Дата создания'
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
                            model: 'server_id',
                            type: 'input', inputType: 'text',
                            label: 'Сервер'
                        },
                        {
                            model: 'node',
                            type: 'input', inputType: 'text',
                            label: 'Нода'
                        }
                    ]
                }
            }
        ]
    }
}

const MODULE_NAME = 'loggerLogs';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path: `${MODULE_PATH}/update/:_id`,
        name: `${MODULE_NAME}Update`,
        component: SmartGraphqlForm,
        meta: {
            title: async function () {
                await this.apolloLoaded ();
                return `Изменить локальную запись лога "${this.model.message}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Изменить локальную запись лога "${this.model.message}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'update',
            schema: vueSchemaFactory,
            gqlRoot: 'loggerLogs',
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
                label: 'Записи лога',
                parent: 'home'
            }
        },
        props: {
            columns: [
                {
                    label: 'Тэг', field: 'tag',
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
                    label: 'Уровень', field: 'level',
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
                    label: 'Сообщение', field: 'message',
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
                    label: 'Дополнительное инфо', field: 'dataString',
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
                    label: 'Дата создания', field: 'created',
                    filterOptions: {
                        enabled: true, // enable filter for this column
                        placeholder: 'Поиск..', // placeholder for filter input
                        filterValue: undefined, // initial populated value for this filter
                        trigger: 'enter', //only trigger on enter not on keyup
                        transform ($input) {
                            return String ($input).length > 0 ? new RegExp ($input, 'i') : undefined;
                        }
                    },
                    formatFn: function (created) {
                        return formatRuDateTime (created);
                    }
                }
            ],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        loggerLogs{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.loggerLogs.list.rows;
                    this.totalRecords = data.loggerLogs.list.total;
                }
            }
        }
    }
];