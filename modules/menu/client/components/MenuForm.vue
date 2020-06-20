<template>
    <SmartGraphqlForm ref="smartForm" v-if="libLoaded" v-bind="$props" :schema="vueSchemaFactory"/>
</template>

<script>
    import SmartGraphqlForm from "../../../../client/components/SmartGraphqlForm";
    import {codemirror, currentUserId} from "../../../../client/vue-form-generator/schemaBoilerplates";
    let menuDataSchemasModule = import(/* webpackIgnore: true */'./menuDataSchemas.js');
    import _ from 'underscore';
    import gql from 'graphql-tag';

    /*
    const scriptExport = import(
        /* webpackIgnore: true */
    /* webpackChunkName: "my-chunk-name" */
    /* webpackMode: "lazy" */
    /* webpackPrefetch: true * /
    /* webpackPreload: true * /
    'menuDataSchemas');
*/
    export default {
        name: 'MenuForm',
        props: SmartGraphqlForm.options.props,
        components: {SmartGraphqlForm},
        data () {
            return {
                libLoaded: false
            };
        },
        async created () {
            this.menuDataSchemas = (await menuDataSchemasModule).default;
            this.libLoaded = true;
            if(this.mode==='update') {
                this.$nextTick(async ()=>{
                    await this.$refs.smartForm.apolloLoaded ();
                    this.$recompute ('vueSchemaFactory');
                });
            }
        },

        recomputed : {
            vueSchemaFactory () {
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
                            onChanged:()=>{
                                this.$recompute('vueSchemaFactory');
                            },
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
                _.each (this.menuDataSchemas, (dataSchema, menu_id) => {
                    if(this.$refs?.smartForm?.model?.menu_type_id===menu_id) {
                        result.fields.push ({
                            model: 'data',
                            default () {
                                return {}
                            },
                            type: 'object',
                            schema: dataSchema
                        });
                    }
                });
                return result;
            },
        },

        methods:{
            waitModelName(){
                return new Promise((resolve)=>{
                    let unwatch = this.$watch('$refs.smartForm.model.name',()=>{
                        let modelName = this.$refs?.smartForm?.model?.name;
                        this.$nextTick(()=>{
                            if(modelName){
                                unwatch();
                                return resolve(modelName);
                            }
                        });
                    },{ immediate:true,deep:false });
                });
            }
        }


    }
</script>