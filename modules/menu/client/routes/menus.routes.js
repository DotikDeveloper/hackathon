import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import {createDefaultObject} from "/client/vue-form-generator/utils/schema";
import {codemirror, currentUserId} from "/client/vue-form-generator/schemaBoilerplates";
import _ from 'underscore';
import MenuEditor from "../components/MenuEditor";
import MenuForm from "../components/MenuForm";
const fragment = `
	_id
	name
	user_id
	ctxClassExpr
	menu_type_id
	data
	acl
`;

function vueSchemaFactory () {
    let result = {
        fields: [
            {
                model: 'name',
                type: 'input', inputType: 'text',
                required: true, validator: 'required',
                label: 'Имя'
            }, {
                ...currentUserId(),
                label: 'Владелец'
            }, {
                model: 'menu_type_id',
                label: 'Тип',
                type: 'autocomplete',
                multiple: false,
                apollo: {
                    query: gql`
                        query MenuTypesAutocomplete($pagination:PaginationOptions){
                            menuTypes{
                                list(pagination:$pagination){
                                    rows{
                                        name _id
                                    }
                                }
                            }
                        }
                    `,
                    variables: (options) => {
                        let filters = {};
                        if (options.term) {
                            filters.name = new RegExp (options.term, 'i');
                        }
                        if (options.ids) {
                            filters._id = {$in: options.ids};
                        }
                        let page = options.page || 0;
                        let perPage = options.perPage || 100;
                        return {
                            pagination: {
                                filters: filters,
                                page: page,
                                perPage: perPage,
                                sort: {
                                    name: 1
                                }
                            }
                        }
                    },
                    update (data) {
                        return _.chain (data.menuTypes.list.rows)
                        .map ((m) => {
                            return {id: m._id, label: m.name};
                        })
                        .value ();
                    }
                },
                required: true,
                validator: 'required'
            }, {
                ...codemirror (),
                model: 'ctxClassExpr',
                label: 'Класс контекста меню'
            }
        ]
    };
    _.each(this.menuDataSchemas,(dataSchema,menu_id)=>{
        result.fields.push({
            model:'data',
            default(){return {}},
            type:'object',
            schema:dataSchema,
            visible(model){
                return model.menu_type_id === menu_id;
            }
        })
    });
    return result;
}

const MODULE_NAME = 'menus';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path:`${MODULE_PATH}/editor/:_id`,
        name: `${MODULE_NAME}Editor`,
        component:MenuEditor,
        meta: {
            title: async function () {
                await this.apolloLoaded ();
                return `Редактор меню "${this.menu.name}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Редактор меню "${this.menu.name}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
    },
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: MenuForm,
        meta: {
            title: 'Создать новое меню',
            breadcrumbs: {
                label: 'Создать новое',
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'create',
            schema: vueSchemaFactory,
            gqlRoot: 'menus',
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
        component: MenuForm,
        meta: {
            title: async function () {
                let modelName = await this.waitModelName();
                return `Изменить меню "${modelName}"`;
            },
            breadcrumbs: {
                label: async function () {
                    let modelName = await this.waitModelName();
                    return `Изменить меню "${modelName}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'update',
            schema: vueSchemaFactory,
            gqlRoot: 'menus',
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
            title:'Меню',
            breadcrumbs: {
                label: 'Меню',
                parent: 'home'
            }
        },
        props: {
            header: 'DynamicLink',
            headerParams: {
                to: `${MODULE_PATH}/create`,
                anchor: 'Создать'
            },
            columns: [{
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
            },{
                label:'',field:'_id',
                component: 'DynamicLink',
                componentParams: function (row) {
                    return {
                        to: {name: `${MODULE_NAME}Editor`, params: {_id: row._id}},
                        anchor: 'Редактор'
                    }
                },
            },{
                label:'Действия',
                field:'acl',
                components:[
                    {
                        component:'RemoveAction',
                        componentParams(model){
                            return {
                                gqlRoot:'menus',
                                model,
                                text:`Вы действительно хотите меню "${model.name}" ?`
                            }
                        }
                    }
                ]
            }],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        menus{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.menus.list.rows;
                    this.totalRecords = data.menus.list.total;
                }
            }
        }
    }
];