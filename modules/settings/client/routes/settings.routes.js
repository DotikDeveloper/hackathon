import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import {createDefaultObject} from "/client/vue-form-generator/utils/schema";
import {graphqlClone} from "../../../../lib/utils";
import SettingsForm from "../components/SettingsForm";
const fragment = `
	_id
	system_name
	label
	data
	vfgSchema
	acl
`;


const MODULE_NAME = 'settings';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: SettingsForm,
        meta: {
            title: 'Создать новую настройку',
            breadcrumbs: {
                label: 'Создать новый',
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'create',
            gqlRoot: 'settings',
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
        component: SettingsForm,
        meta: {
            title: async function () {
                let modelName = await this.waitModelName();
                return `Изменить настройку "${modelName}"`;
            },
            breadcrumbs: {
                label: async function () {
                    let modelName = await this.waitModelName();
                    return `Изменить настройку "${modelName}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'update',
            gqlRoot: 'settings',
            fragment: fragment,
            apollo: {
                queries: {
                    create: null,
                    update: {
                        query: gql`
                            query SettingsView($_id:String!){
                                settings{
                                    view(_id:$_id){
                                        ${fragment}
                                    }
                                }
                            }
                        `,
                        variables () {
                            return {
                                _id: this.$route.params._id
                            }
                        },
                        async update (data) {
                            this.model = data.settings.view;

                        }
                    },
                    validate: {
                        query: gql`
                            query SettingsValidate($model:JSONObject!){
                                settings{
                                    validate(model:$model){
                                        errors{
                                            message
                                            type
                                            path
                                            value
                                            field
                                        }
                                    }
                                }
                            }
                        `,
                        variables () {
                            return {
                                model: graphqlClone (this.model)
                            }
                        },
                        update (data) {
                            this.validateResult = data.settings.validate;
                        }
                    }
                },
                mutations: {
                    create: {
                        mutation: gql`mutation SettingsCreate($model:JSONObject!){
                            settings{
                                create(model:$model){
                                    success,message,errors,_id,model
                                }
                            }
                        }
                        `,
                        variables () {
                            return {
                                model: graphqlClone (this.model)
                            }
                        }
                    },
                    update: {
                        mutation: gql`
                            mutation SettingsEdit ($_id:String!,$model:JSONObject!) {
                                settings{
                                    edit(_id:$_id,model:$model){
                                        message,success,errors
                                    }
                                }
                            }
                        `,
                        variables () {
                            return {
                                _id: this.model._id,
                                model: this.graphqlClone (this.model)
                            };
                        }
                    }
                }
            },
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
                label: 'Настройки',
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
                    label: 'Служебное имя', field: 'system_name',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {name: `${MODULE_NAME}Update`, params: {_id: row._id}},
                            anchor: row.system_name
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
                    label: 'Отображаемое имя', field: 'label',
                    filterOptions: {
                        enabled: true, // enable filter for this column
                        placeholder: 'Поиск..', // placeholder for filter input
                        filterValue: undefined, // initial populated value for this filter
                        trigger: 'enter', //only trigger on enter not on keyup
                        transform ($input) {
                            return String ($input).length > 0 ? new RegExp ($input, 'i') : undefined;
                        }
                    }
                }, {
                    label: 'Введенные данные', field: 'data',
                    component: 'VueJsonPretty',
                    componentParams: function (row) {
                        return {
                            data: row.data
                        }
                    }
                }
            ],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        settings{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.settings.list.rows;
                    this.totalRecords = data.settings.list.total;
                }
            }
        }
    }
];