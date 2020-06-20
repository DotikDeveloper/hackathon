<template>
    <div>
        <vue-form-generator :schema="schema" :model="model" :options="schema.formOptions"></vue-form-generator>
        <!--
        <vue-json-pretty :data="model"/>
        -->
    </div>
</template>
<script>
import EJSON from "ejson";
import _ from 'underscore';
import VueSchemaBuilder from "../../../../client/VueSchemaBuilder";
import {cloneDeep} from 'lodash';
import pretty from "../../../../lib/pretty";

export default {
    name:'MenuItemForm',
    data(){
        return {
            changed:false,
            oldModel:null
        }
    },
    props: ['model','menuType'],
    updated() {
        console.log('updated');
    },
    watch:{
        model:{
            immediate: true,
            deep: true,
            handler(newModel,oldModel) {
                console.log('onModelChanged model:',newModel);
                if (!oldModel || newModel._id != oldModel._id) {
                    this.changed = false;
                    this.oldModel = EJSON.parse(EJSON.stringify(newModel));
                } else if (EJSON.stringify(newModel) != EJSON.stringify(this.oldModel)) {
                    this.changed = true;
                    this.$emit('change', newModel);
                }
            }
        },
    },
    methods:{
        onSubmit(evt) {
            console.log(evt);
            this.$emit('submit');
        },
        onCancel(){
            this.$emit('cancel',this.oldModel);
        }
    },
    computed: {
        show() {
            return !!this.model;
        },
        schema(){
            let schema = {
                fields:[
                    {
                        model:'label',
                        type: "input",
                        inputType: "text",
                        label:'Заголовок'
                    }
                ]
            };
            let definition = window.menuTypeSchema[this.menuType._id][this.model.block_id].vfgSchema;
            let vfgSchema = cloneDeep(definition)
            schema.fields.push({
                type:'object',
                model:'data',
                schema:vfgSchema
            });
            if(this.model.menuBlock.addSystemButtons){
                schema = new VueSchemaBuilder( schema )
                .withGroup({
                    styleClasses:'mt-buttons',
                    fields:[
                        {
                            "name":'successButton',
                            "type": "submit",
                            "buttonText": "Готово",
                            "readonly": false,
                            "featured": false,
                            "disabled": false,
                            "onSubmit": _.bind(this.onSubmit, this),
                            validateBeforeSubmit: true,
                            styleClasses: ' col-',
                            fieldClasses: 'btn btn-success',
                            visible:()=>{
                                return !!this.model;
                            }
                        }, {
                            "name":'cancelButton',
                            "type": "submit",
                            "buttonText": "Отмена",
                            "readonly": false,
                            "featured": false,
                            "disabled": false,
                            "onSubmit": _.bind(this.onCancel, this),
                            visible:()=>{
                                return this.model && this.changed;
                            },
                            styleClasses: ' col-',
                            fieldClasses: 'btn btn-danger'
                        }
                    ]
                })
                    /*.withGroup({
                        styleClasses:'mt-buttons',
                        fields:[
                            {
                                "type": "submit",
                                "buttonText": "Готово",
                                "readonly": false,
                                "featured": false,
                                "disabled": false,
                                "onSubmit": _.bind(this.onSubmit,this),
                                validateBeforeSubmit:true,
                                styleClasses:'mt-button-success',
                                visible:()=>{
                                    return !!this.model;
                                }
                            },{
                                "type": "submit",
                                "buttonText": "Отмена",
                                "readonly": false,
                                "featured": false,
                                "disabled": false,
                                "onSubmit": _.bind(this.onCancel,this),
                                styleClasses:'mt-button-cancel',
                                visible:()=>{
                                    return this.model && this.changed;
                                }
                            }
                        ]})*/
                    .build();
            }
            return schema;
        },
        json(){
            return pretty(this.model,4,'HTML');
        }
    }
};

</script>

<style>
    .hidden{
        display: none !important;
    }
</style>