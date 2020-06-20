import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import _ from 'underscore';
import SmartGraphqlForm from "/client/components/SmartGraphqlForm";
import {createDefaultObject} from "/client/vue-form-generator/utils/schema";

const fragment = `
	_id
	name
	icon
	index
yaMarketCategories{_id name}
`;

function vueSchemaFactory () {
    return {
        fields: [
            {
                model: 'index',
                type: 'input', inputType: 'number',
                default:0,
                label: 'Индекс категории'
            },
            {
                model: 'name',
                type: 'input', inputType: 'text',
                required: true, validator: 'required',
                label: 'Имя категории'
            },
            {
                model: 'icon',
                type: 'input', inputType: 'text',
                required: true, validator: 'required',
                label: 'Иконка'
            }
        ]
    }
}

const MODULE_NAME = 'foodCategories';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: SmartGraphqlForm,
        meta: {
            title: 'Создать новый Категории еды',
            breadcrumbs: {
                label: 'Создать новый',
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'create',
            schema: vueSchemaFactory,
            gqlRoot: 'foodCategories',
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
                return `Изменить Категории еды "${this.model.name}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Изменить Категории еды "${this.model.name}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'update',
            schema: vueSchemaFactory,
            gqlRoot: 'foodCategories',
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
                label: 'Категории еды',
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
                    label: 'Имя категории', field: 'name',

                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {name: `${MODULE_NAME}Update`, params: {_id: row._id}},
                            anchor: `${row.icon} ${row.name}`
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
                    label: 'Категории ЯМаркета', field: 'yaMarketCategories',
                    component: 'DynamicLinks',
                    componentParams: function (row) {
                        let data = _.chain (row.yaMarketCategories)
                        .map ((yaCategory) => {
                            return {
                                to: {
                                    name: `yaMarketCategoriesUpdate`,
                                    params: {
                                        _id: yaCategory._id
                                    }
                                },
                                anchor: yaCategory.name
                            }
                        })
                        .value ();
                        return {data};
                    }
                }


            ],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        foodCategories{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.foodCategories.list.rows;
                    this.totalRecords = data.foodCategories.list.total;
                }
            }
        }
    }
];