import Vue from 'vue';
import SmartGraphqlForm from "/client/components/SmartGraphqlForm";
import {graphqlClone} from "/lib/utils";
import gql from 'graphql-tag';
import $ from 'jquery';
import pretty from "/lib/pretty";
import _ from 'underscore';
export default Vue.extend({
    name: 'VMTemplatesForm',
    mixins:[SmartGraphqlForm],
    methods:{
        async doRun(){
            let model = graphqlClone(this.model);
            let response = await this.$apollo.query({
                query:gql`
                    query VMTemplatesRun($model:JSONObject){
                        vmTemplates{
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
            const runResult = response.data.vmTemplates.run;
            const $area = $('#resultArea');
            if(runResult.error){
                $area.addClass('error');
                $area.css('color','red');
                $area.val(runResult.error);
            }else{
                $area.removeClass('error');
                $area.css('color','black');
                let result = runResult.result.result;
                if(!_.isString(result)){
                    result = pretty(result)
                }
                $area.val( result );
            }
        }
    }
})