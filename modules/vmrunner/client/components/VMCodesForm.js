import Vue from 'vue';
import SmartGraphqlForm from "/client/components/SmartGraphqlForm";
import {graphqlClone} from "/lib/utils";
import gql from 'graphql-tag';
import $ from 'jquery';
import pretty from "/lib/pretty";

export default Vue.extend({
    name: 'VMCodesForm',
    mixins:[SmartGraphqlForm],
    methods:{
        async doRun(){
            let model = graphqlClone(this.model);
            let response = await this.$apollo.query({
                query:gql`
                    query VMCodesRun($model:JSONObject){
                        vmCodes{
                            run(model:$model){
                                result
                                delay
                                error
                                stack
                            }
                        }
                    }
                `,
                variables:{
                    model:model
                }
            });
            const runResult = response.data.vmCodes.run;
            const $area = $('#resultArea');
            if(runResult.error){
                $area.addClass('error');
                $area.css('color','red');
                $area.val(runResult.error);
            }else{
                $area.removeClass('error');
                $area.css('color','black');
                $area.val(pretty(runResult.result.result) );
            }
        }
    }
})