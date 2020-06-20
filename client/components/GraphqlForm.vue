<template>
    <div>
        <template v-if="$apolloLoading||!this.loaded">
            <vue-loading/>
        </template>
        <div v-else>
            <vue-form-generator :schema="computedSchema"
                                :options="computedSchema.formOptions"
                                :model="model"
                                @model-updated="onModelUpdated"
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
    import Vue from 'vue';
    import EJSON from 'ejson';
    import GraphqlFormMixin from "./graphqlForm/GraphqlFormMixin";

    export default Vue.extend({
        name: 'GraphqlForm',
        mixins:[GraphqlFormMixin],
        data () {
            return {
                privateModel:{}
            }
        },
        computed:{
            model:{
                get(){
                    return this.privateModel;
                },
                set(newModel){
                    let model = EJSON.clone(newModel);
                    if(model){
                        delete model.__typename;
                    }
                    this.privateModel = model;
                }
            }
        }
    });
</script>