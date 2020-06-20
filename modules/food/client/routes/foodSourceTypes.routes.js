import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import _ from 'underscore';
import SmartGraphqlForm from "/client/components/SmartGraphqlForm";
import {createDefaultObject} from "/client/vue-form-generator/utils/schema";
import {imageFile, userId} from "../../../../client/vue-form-generator/schemaBoilerplates";
import {codemirror} from "../../../../client/vue-form-generator/schemaBoilerplates";

const fragment = `
	_id
	name
	image_id
	user_id
	sysName
    user{_id name}
    image{_id urls}
    vfgSchema
`;

function vueSchemaFactory () {
    return {
        fields: [
            {
                model: 'name',
                type: 'input', inputType: 'text',
                label: 'Имя источника'
            },
            {
                ...imageFile(),
                model: 'image_id',
                label: 'Иконка',
            },
            {
                ...userId(),
                model: 'user_id',
                label: 'Создатель'
            },
            {
                model: 'sysName',
                type: 'input', inputType: 'text',
                required: true, validator: 'required',
                label: 'Системное имя'
            },{
                ...codemirror(),
                model:'vfgSchema',
                label:'Схема дополнительных полей источников'
            }
        ]
    }
}

const MODULE_NAME = 'foodSourceTypes';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: SmartGraphqlForm,
        meta: {
            title: 'Создать новый Источник',
            breadcrumbs: {
                label: 'Создать новый',
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'create',
            schema: vueSchemaFactory,
            gqlRoot: 'foodSourceTypes',
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
                return `Изменить Источник "${this.model.name}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Изменить Источник "${this.model.name}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'update',
            schema: vueSchemaFactory,
            gqlRoot: 'foodSourceTypes',
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
                label: 'Источники ',
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
                            to: {
                                name: `${MODULE_NAME}Update`,
                                params: {
                                    _id: row._id
                                }
                            },
                            anchor: row.name,
                            img: row?.image?.urls?.small
                        }
                    }
                },{
                    label: 'Создатель', field: 'user',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {
                                name: `usersUpdate`,
                                params: {_id: row._id}
                            },
                            anchor: row.user?.name,
                            img:row.user?.avatar
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
                }
            ],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        foodSourceTypes{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.foodSourceTypes.list.rows;
                    this.totalRecords = data.foodSourceTypes.list.total;
                }
            }
        }
    }
];