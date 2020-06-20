import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import SmartGraphqlForm from "/client/components/SmartGraphqlForm";
import {createDefaultObject} from "/client/vue-form-generator/utils/schema";
import {LogLevels} from "../../enums";
import {graphqlClone} from "../../../../lib/utils";

const fragment = `
	_id
	name
	label
	levels{
		console
		mongo
		mongoGlobal
	}
	acl
`;

function vueSchemaFactory () {
    return {
        fields: [
            {
                model: 'name',
                type: 'input', inputType: 'text',
                required: true, validator: 'required',
                label: 'Системное имя'
            },
            {
                model: 'label',
                type: 'input', inputType: 'text',
                required: true, validator: 'required',
                label: 'Отображаемое имя'
            },
            {
                model: 'levels',
                type: 'object',
                default:{},
                schema: {
                    fields: [
                        {
                            model: 'console',
                            type: 'select',
                            label: 'Консоль',
                            values: LogLevels.toSelect(),
                            required: true,
                            default:LogLevels.silly.key,
                            validator (value) {
                                if (!LogLevels[value]) {
                                    return ['Недопустимое значение'];
                                }
                                return [];
                            }
                        },
                        {
                            model: 'mongo',
                            type: 'select',
                            label: 'В БД (локальную)',
                            values: LogLevels.toSelect(),
                            required: true,
                            default:LogLevels.silly.key,
                            validator (value) {
                                if (!LogLevels[value]) {
                                    return ['Недопустимое значение'];
                                }
                                return [];
                            }
                        },
                        {
                            model: 'mongoGlobal',
                            type: 'select',
                            label: 'В БД (глобально)',
                            values: LogLevels.toSelect(),
                            required: true,
                            default:LogLevels.silly.key,
                            validator (value) {
                                if (!LogLevels[value]) {
                                    return ['Недопустимое значение'];
                                }
                                return [];
                            }
                        }
                    ]
                }
            }
        ]
    }
}

const MODULE_NAME = 'loggerTags';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: SmartGraphqlForm,
        meta: {
            title: 'Создать новый Теги логирования',
            breadcrumbs: {
                label: 'Создать новый',
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'create',
            schema: vueSchemaFactory,
            gqlRoot: 'loggerTags',
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
                return `Изменить Теги логирования "${this.model.name}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Изменить Теги логирования "${this.model.name}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'update',
            schema: vueSchemaFactory,
            gqlRoot: 'loggerTags',
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
                label: 'Теги логирования',
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
                    label: 'Системное имя', field: 'name',
                },
                {
                    label: 'Отображаемое имя', field: 'label',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {name: `${MODULE_NAME}Update`, params: {_id: row._id}},
                            anchor: row.label
                        }
                    }
                },
                {
                    label: 'Уровни логирования', field: 'levels',
                    formatFn: function (value) {
                        return JSON.stringify(graphqlClone(value));
                    }
                }
            ],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        loggerTags{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.loggerTags.list.rows;
                    this.totalRecords = data.loggerTags.list.total;
                }
            }
        }
    }
];