<template>
    <SmartGraphqlForm ref="smartForm" v-if="libLoaded" v-bind="$props" :schema="vueSchemaFactory"/>
</template>

<script>
    import SmartGraphqlForm from "../../../../client/components/SmartGraphqlForm";
    import {codemirror} from "../../../../client/vue-form-generator/schemaBoilerplates";
    let settingsDataSchemas = import(/* webpackIgnore: true */'./settingsDataSchemas.js');
    import _ from 'underscore';

    export default {
        name: 'SettingsForm',
        props: SmartGraphqlForm.options.props,
        components: {SmartGraphqlForm},
        data () {
            return {
                libLoaded: false
            };
        },
        async created () {
            this.settingsDataSchemas = (await settingsDataSchemas).default;
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
                            model: 'system_name',
                            type: 'input', inputType: 'text',
                            required: true, validator: 'required',
                            label: 'Служебное имя'
                        },
                        {
                            model: 'label',
                            type: 'input', inputType: 'text',
                            required: true, validator: 'required',
                            label: 'Отображаемое имя'
                        }, {
                            ...codemirror (),
                            model: 'vfgSchema',
                            required: true, validator: 'required',
                            label: 'VFG схема данных'
                        }
                    ]
                };
                if(this.mode==='update') {
                    _.each (this.settingsDataSchemas, (dataSchema, setting_id) => {
                        if (this.$refs?.smartForm?.model?._id === setting_id) {
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
                }
                return result;
            },
        },

        methods:{
            waitModelName(){
                return new Promise((resolve)=>{
                    let unwatch = this.$watch('$refs.smartForm.model.name',()=>{
                        let modelLabel = this.$refs?.smartForm?.model?.label;
                        this.$nextTick(()=>{
                            if(modelLabel){
                                unwatch();
                                return resolve(modelLabel);
                            }
                        });
                    },{ immediate:true,deep:false });
                });
            }
        }


    }
</script>