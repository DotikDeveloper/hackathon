import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import _ from 'underscore';
import SmartGraphqlForm from "/client/components/SmartGraphqlForm";
import {createDefaultObject} from "/client/vue-form-generator/utils/schema";
import {currentUserId} from "../../../../client/vue-form-generator/schemaBoilerplates";

const fragment = `
	_id
	menu_id
	user_id
	top
	left
	index
	block_id
	label
	data
    menu{_id name}
    user{_id name}
    menuBlock{_id name}
    acl
`;

function vueSchemaFactory () {
    return {
        fields: [
            {
                model: 'menu_id',
                type: 'input', inputType: 'text',
                required: true, validator: 'required',
                label: 'Меню'
            },
            {
                ...currentUserId(),
                label: 'Владелец'
            },
            {
                model: 'top',
                type: 'input', inputType: 'number',
                label: 'Отступ сверху'
            },
            {
                model: 'left',
                type: 'input', inputType: 'text',
                label: 'Отступ слева'
            },
            {
                model: 'index',
                type: 'input', inputType: 'text',
                label: 'Индекс'
            },
            {
                model: 'block_id',
                type: 'input', inputType: 'text',
                required: true, validator: 'required',
                label: 'Блок'
            },
            {
                model: 'label',
                type: 'input', inputType: 'text',
                label: 'Заголовок'
            },
            {
                model: 'data',
                type: 'object',
                schema: {
                    fields: []
                }
            }
        ]
    }
}

const MODULE_NAME = 'menuItems';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: SmartGraphqlForm,
        meta: {
            title: 'Создать новый Элементы меню',
            breadcrumbs: {
                label: 'Создать новый',
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'create',
            schema: vueSchemaFactory,
            gqlRoot: 'menuItems',
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
                return `Изменить Элементы меню "${this.model.name}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Изменить Элементы меню "${this.model.name}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'update',
            schema: vueSchemaFactory,
            gqlRoot: 'menuItems',
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
                label: 'Элементы меню',
                parent: 'home'
            }
        },
        props: {
            header: 'DynamicLink',
            headerParams: {
                to: `${MODULE_PATH}/create`,
                anchor: 'Создать'
            },
            columns: [],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        menuItems{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.menuItems.list.rows;
                    this.totalRecords = data.menuItems.list.total;
                }
            }
        }
    }
];