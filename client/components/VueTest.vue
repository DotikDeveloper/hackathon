<template>
    <div>
        <vue-form-generator :schema="schema" :model="model" :options="schema.formOptions"
                            path=""
                            @model-updated="onModelUpdated"
        ></vue-form-generator>
    </div>
</template>

<script>
    export default {
        props:{
            template:String
        },
        data(){
            return {
                child:null,
                model:{
                    someText:'textValue'
                },
                schema:{
                    fields:[{
                        model:'someText',
                        type:'input',
                        inputType:'text',
                        label:'Text'
                    }],
                    template:`
                    <div>
                        SCHEMA TEMPLATE
                        <someText/>
                    </div>
                    `
                }
            }
        },
        computed:{

        },
        created () {

        },
        methods:{
            onModelUpdated(){
                //alert('onModelUpdated');
            }
        }
    }
</script>