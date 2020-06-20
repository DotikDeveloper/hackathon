import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import _ from 'underscore';
import SmartGraphqlForm from "/client/components/SmartGraphqlForm";
import {createDefaultObject} from "/client/vue-form-generator/utils/schema";
import {formatRuDateTime} from "../../../../lib/utils";
import CustomMap from "../components/CustomMap";
const fragment = `
	_id
	text
	images
	data
	food_source_id
	created
	expiries
	link
	active
foodSource{_id name}
region
point
address
`;

function vueSchemaFactory () {
    return {
        fields: [
            {
                model: 'text',
                type: 'input', inputType: 'text',
                label: 'Текст предложения'
            },
            {
                model: 'images',
                type: 'input', inputType: 'text',
                label: 'Ссылки на изображения'
            },
            {
                model: 'data',
                type: 'object',
                schema: {
                    fields: []
                }
            },
            {
                model: 'food_source_id',
                type: 'input', inputType: 'text',
                required: true, validator: 'required',
                label: 'Источник'
            },
            {
                model: 'created',
                type: 'input', inputType: 'text',
                label: 'Время создания'
            },
            {
                model: 'expiries',
                type: 'input', inputType: 'text',
                label: 'Время предложения'
            },
            {
                model: 'link',
                type: 'input', inputType: 'text',
                label: 'Ссылка на оригинал'
            },
            {
                model: 'active',
                type: 'switch',
                label: 'Активно'
            }
        ]
    }
}

const MODULE_NAME = 'foodOffers';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: SmartGraphqlForm,
        meta: {
            title: 'Создать новое Предложение',
            breadcrumbs: {
                label: 'Создать новый',
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'create',
            schema: vueSchemaFactory,
            gqlRoot: 'foodOffers',
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
                return `Изменить Предложения "${this.model.name}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Изменить Предложения "${this.model.name}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'update',
            schema: vueSchemaFactory,
            gqlRoot: 'foodOffers',
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
                label: 'Предложения',
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
                    label: 'Текст', field: 'text',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {
                                name: `${MODULE_NAME}Update`,
                                params: {
                                    _id: row._id
                                }
                            },
                            anchor: row.text
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
                    label: 'Изображения', field: 'images',
                    type:'array',
                    component:Vue.component('foodoffers-image-urls', {
                        template: `<div><img :src="img" v-for="img in images" style="max-width:200px;"/></div>`,
                        props:['images']
                    }),
                    componentParams: function (row) {
                        return {
                            images:row.images
                        }
                    }
                },

                {
                    label: 'Оригинал', field: 'link',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: row.link,
                            anchor: row.link,
                        }
                    }
                },

                {
                    label: 'Время создания', field: 'created',
                    formatFn: formatRuDateTime
                },
                {
                    label:'Месторасположение',field:'address'
                }

                /*{
                    label:'Месторасположение',field:'point',
                    component: CustomMap,
                    componentParams: function (row) {
                        return {
                            show:!!(row.point && row.region),
                            coords:row.point?[row.point.lat,row.point.long]:[],
                            bounds:(()=>{
                                if(row.region){
                                    return [
                                        [row.region.lowerCorner.lat,row.region.lowerCorner.long],
                                        [row.region.upperCorner.lat,row.region.upperCorner.long],
                                    ]
                                }
                            })()
                        }
                    }
                }*/


            ],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        foodOffers{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.foodOffers.list.rows;
                    this.totalRecords = data.foodOffers.list.total;
                }
            }
        }
    }
];