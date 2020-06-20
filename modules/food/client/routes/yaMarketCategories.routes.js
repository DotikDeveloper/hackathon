import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import _ from 'underscore';
import SmartGraphqlForm from "/client/components/SmartGraphqlForm";
import {createDefaultObject} from "/client/vue-form-generator/utils/schema";
import FoodCategoryInlineForm from "../components/FoodCategoryInlineForm";
const fragment = `
	_id
	name
	ID
	link
	food_category_id
foodCategory{_id name}
`;

function vueSchemaFactory () {
    return {
        fields: [
            {
                model: 'name',
                type: 'input', inputType: 'text',
                required: true, validator: 'required',
                label: 'Имя категории'
            },
            {
                model: 'ID',
                type: 'input', inputType: 'number',
                required: true, validator: 'required',
                label: 'ID маркета'
            },
            {
                model: 'link',
                type: 'input', inputType: 'text',
                label: 'Ссылка'
            },
            {
                model: 'food_category_id',
                type: 'input', inputType: 'text',
                label: 'ID категории фудшеринга'
            }
        ]
    }
}

const MODULE_NAME = 'yaMarketCategories';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: SmartGraphqlForm,
        meta: {
            title: 'Создать новый Категории ЯМаркета',
            breadcrumbs: {
                label: 'Создать новый',
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'create',
            schema: vueSchemaFactory,
            gqlRoot: 'yaMarketCategories',
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
                return `Изменить Категории ЯМаркета "${this.model.name}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Изменить Категории ЯМаркета "${this.model.name}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'update',
            schema: vueSchemaFactory,
            gqlRoot: 'yaMarketCategories',
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
                label: 'Категории ЯМаркета',
                parent: 'home'
            }
        },
        props: {
            columns: [
                {
                    label: 'Имя категории', field: 'name',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {
                                name: `${MODULE_NAME}Update`,
                                params: {
                                    _id: row._id
                                }
                            },
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
                    label: 'ID категории фудшеринга', field: 'food_category_id',
                    component: FoodCategoryInlineForm,
                    componentParams: function (row) {
                        return {
                            model:row
                        }
                    }
                },
                {
                    label: 'ID маркета', field: 'ID',
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
                    label: 'Ссылка на ЯМаркет', field: 'link',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: row.link,
                            anchor: row.link,
                        }
                    }
                }


            ],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        yaMarketCategories{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.yaMarketCategories.list.rows;
                    this.totalRecords = data.yaMarketCategories.list.total;
                }
            }
        }
    }
];