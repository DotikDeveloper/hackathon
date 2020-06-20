import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import _ from 'underscore';
import SmartGraphqlForm from "/client/components/SmartGraphqlForm";
import {createDefaultObject} from "/client/vue-form-generator/utils/schema";
import {formatRuDateTime} from "../../../../lib/utils";

let schemasModule = import(/* webpackIgnore: true */'./foodSourcesSchemas.js');

const fragment = `
	_id
	name
	type_id
	data
	created
	parsed
	geoNames
	active
    foodSourceType{_id name}
`;

function vueSchemaFactory () {
    let schema = {
        theme:'bootstrap',
        fields: [
            {
                model: 'name',
                type: 'input', inputType: 'text',
                label: 'Имя'
            },
            {
                model: 'type_id',
                required: true, validator: 'required',
                label: 'Тип',
                type: 'autocomplete',
                multiple: false,
                onChanged:()=>{
                    this.$recompute('computedSchema');
                },
                apollo: {
                    query: gql`
                        query FoodSourcesTypes($pagination:PaginationOptions){
                            foodSourceTypes{
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
                        return _.chain (data.foodSourceTypes.list.rows)
                        .map ((m) => {
                            return {id: m._id, label: m.name};
                        })
                        .value ();
                    }
                },
            },
            {
                model: 'geoNames',
                type: 'array',
                label: 'Гео регионы',
            },
            {
                model: 'active',
                type: 'switch',
                label: 'Активен'
            }
        ]
    };

    _.each (this.foodSourceTypesSchemas, (dataSchema, type_id) => {
        if(this.model?.type_id===type_id) {
            schema.fields.push ({
                label:'Дополнительные поля выбранного типа источника',
                model: 'data',
                default () {
                    return {}
                },
                type: 'object',
                schema: dataSchema
            });
        }
    });
    return schema;
}

async function preload(){
    this.foodSourceTypesSchemas = (await schemasModule).default;
}

const MODULE_NAME = 'foodSources';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: SmartGraphqlForm,
        meta: {
            title: 'Создать новый Источники фудшеринга',
            breadcrumbs: {
                label: 'Создать новый',
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            preload,
            mode: 'create',
            schema: vueSchemaFactory,
            gqlRoot: 'foodSources',
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
        preload,
        path: `${MODULE_PATH}/update/:_id`,
        name: `${MODULE_NAME}Update`,
        component: SmartGraphqlForm,
        meta: {
            title: async function () {
                await this.apolloLoaded ();
                return `Изменить Источники фудшеринга "${this.model.name}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Изменить Источники фудшеринга "${this.model.name}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'update',
            schema: vueSchemaFactory,
            gqlRoot: 'foodSources',
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
                label: 'Источники фудшеринга',
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
                    },


                },

                {
                    label: 'Тип', field: 'type_id',

                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {
                                name: `foodSourceTypesUpdate`,
                                params: {
                                    _id: row._id
                                }
                            },
                            anchor: row.foodSourceType?.name,
                            img: row.foodSourceType?.image?.urls?.small
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
                    label: 'Время последней проверки записей', field: 'parsed',
                    formatFn: function (value) {
                        return formatRuDateTime (value);
                    }
                }


            ],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        foodSources{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.foodSources.list.rows;
                    this.totalRecords = data.foodSources.list.total;
                }
            }
        }
    }
];