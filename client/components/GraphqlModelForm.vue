<template>
    <div>
        <div v-if="$apolloLoading">Loading...</div>
        <div v-else>
            <vue-form-generator :schema="computedSchema" :options="computedSchema.formOptions"
                                :model="privateModel"
                                @model-updated="onModelUpdated"
                                ref="vfg"
                                path=""
            ></vue-form-generator>
        </div>

        <div v-if="currentUpload">
            <div class="progress">
                <div class="progress-bar" role="progressbar" :style="requestProgressStyle"
                     :aria-valuenow="requestProgressInt" aria-valuemin="0" aria-valuemax="100">
                    {{requestProgressFloat}} %
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import VueSchemaBuilder from "../VueSchemaBuilder";
    import _ from 'underscore';
    import {get} from 'lodash';
    import GraphqlFormMixin from "./graphqlForm/GraphqlFormMixin";
    import Vue from 'vue';

    export default Vue.extend({
        name: 'GrapqlModelForm',
        mixins:[GraphqlFormMixin],
        props: {
            'model':{
                type:Object,
                default(){
                    return {}
                }
            }
        },
        data () {
            return {
                changed:false,
                currentUpload:null,
                privateModel:{}
            }
        },

        watch: {
            model: {
                deep:true,
                immediate:true,
                handler: function (newModel) {
                    this.privateModel = newModel;
                }
            }
        },

        computed:{
            computedSchema(){
                let schema = _.isFunction( this.schema ) ? this.schema.apply(this) : this.schema;
                let buttonFields = _.isFunction(this.buttons)?this.buttons.apply(this):this.buttons;
                return  new VueSchemaBuilder(schema)
                .withFields(buttonFields)
                .build();
            },
            requestProgressInt(){
                return get( this.currentUpload,'progress',0);
            },
            requestProgressFloat(){
                let progress = get( this.currentUpload,'progress',0);
                return progress.toFixed(2);
            },
            requestProgressStyle(){
                return `width: ${this.requestProgressInt}%;`;
            }
        },

        methods:{
            validate(){
                if(!this.$refs.vfg)
                    return Promise.resolve([]);
                return this.$refs.vfg.validate();
            },
            onModelUpdated(model,schema){
                this.changed=true;
                this.$emit('model-updated',model,schema);
            }
        }
    });
</script>