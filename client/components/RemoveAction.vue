<template>
    <div>
        <button type="button" class="btn btn-danger"  v-on:click="clickRemove" :disabled="!isEnabled()">{{buttonText}}</button>
    </div>
</template>

<script>
    // eslint-disable-next-line no-unused-vars
    import gql from 'graphql-tag';
    import _ from 'underscore';

    export default {
        name: 'RemoveAction',
        props: {
            gqlRoot: {
                type: String
            },
            model: {
                type: Object,
                default: null
            },
            title: {
                type: String,
                default: 'Удалить?'
            },
            text: {
                type: String,
                default: null
            },
            buttonText: {
                type: String,
                default: 'Удалить'
            },
            enabled:{
                default(){
                    return function(){
                        return this.allowed(this.model,'remove');
                    }
                }
            }
        },

        methods: {
            async clickRemove () {
                let success = await this.removeConfirm ();
                let gqlRoot = this.gqlRoot;
                if (success) {
                    let query = {
                        query: gql(`mutation ${gqlRoot}Remove($_id:String!){
                        ${gqlRoot}{
                            remove(_id: $_id){
                                success errors message
                            }
                        }
                    }`),
                        variables:{_id:this.model._id},
                        markLoading:false
                    };
                    let response = await this.apolloQuery (query);
                    if(response&&response.data){
                        let removeResponse = response.data[gqlRoot].remove;
                        if(removeResponse.success){
                            this.flash(removeResponse.message, 'success', {
                                timeout: 5000,
                            });
                        }else{
                            let message = removeResponse.message;
                            if(!message){
                                message = _.first(removeResponse.errors);
                            }
                            this.flash(message, 'error', {
                                timeout: 5000,
                            });
                        }
                    }
                }
            },

            removeConfirm () {
                let text = this.text || `Вы действительно хотите удалить "${this.model?.name}" ?`;
                return new Promise (resolve => {
                    this.$modal.show ('dialog', {
                        title: this.title,
                        text,
                        buttons: [
                            {
                                title: 'Да',
                                class: "btn btn-danger",
                                handler: () => {
                                    this.$modal.hide ('dialog');
                                    resolve (true);
                                }
                            },
                            {
                                title: 'Нет',       // Button title
                                default: true,    // Will be triggered by default if 'Enter' pressed.
                                class: "btn btn-success",
                                handler: () => {
                                    this.$modal.hide ('dialog');
                                    resolve (false);
                                }
                            }
                        ]
                    })
                });
            },

            isEnabled(){
                return this.enabled();
            }
        }
    }
</script>

<style>

</style>