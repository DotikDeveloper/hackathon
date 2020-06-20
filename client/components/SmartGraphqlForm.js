import Vue from 'vue';
import GraphqlForm from "./GraphqlForm";
import gql from 'graphql-tag'
import {graphqlClone} from "../../lib/utils";
export default Vue.extend({
    name: 'SmartGraphqlForm',
    mixins:[GraphqlForm],
    props:{
        gqlRoot:{
            type:String
        },
        fragment:{
            type:String
        },
        apollo:{
            default(){
                const gqlRoot = this.$options.propsData.gqlRoot;
                const gqlRootUpper = gqlRoot.charAt(0).toUpperCase() + gqlRoot.substring(1);
                const fragment = this.$options.propsData.fragment;
                return {
                    queries:{
                        create:null,
                        update:{
                            query:gql(`
                                query ${gqlRootUpper}View($_id:String!){
                                    ${gqlRoot}{
                                        view(_id:$_id){
                                            ${fragment}
                                        }
                                    }
                                }
                            `),
                            variables(){
                                return {
                                    _id: this.$route.params._id
                                }
                            },
                            update(data){
                                this.model = data[gqlRoot].view;
                            }
                        },
                        validate:{
                            query:gql(`
                                query ${gqlRootUpper}Validate($model:JSONObject!){
                                    ${gqlRoot}{
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
                            `),
                            variables(){
                                return {
                                    model:graphqlClone(this.model)
                                }
                            },
                            update(data){
                                this.validateResult = data[gqlRoot].validate;
                            }
                        }
                    },
                    mutations:{
                        create:{
                            mutation:gql(`
                                mutation ${gqlRootUpper}Create($model:JSONObject!){
                                    ${gqlRoot}{
                                        create(model:$model){
                                            success,message,errors,_id,model
                                        }
                                    }
                                }
                            `),
                            variables(){
                                return {
                                    model:graphqlClone(this.model)
                                }
                            }
                        },
                        update:{
                            mutation:gql(`
                                mutation ${gqlRootUpper}Edit ($_id:String!,$model:JSONObject!) {
                                    ${gqlRoot}{
                                        edit(_id:$_id,model:$model){
                                            message,success,errors
                                        }
                                    }
                                }
                            `),
                            variables(){
                                return {
                                    _id:this.model._id,
                                    model:this.graphqlClone(this.model)
                                };
                            }
                        }
                    }
                }
            }
        }
    }
});