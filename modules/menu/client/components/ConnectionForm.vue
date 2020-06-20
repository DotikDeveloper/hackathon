<template>
    <vue-form-generator v-if="loaded" :schema="schema" :model="model" :options="schema.formOptions">

    </vue-form-generator>
</template>

<script>
    import EJSON from 'ejson';
    import _ from 'underscore';
    import CustomQueryFilter from "../../../../lib/CustomQueryFilter";

    export default {
        name:'ConnectionForm',
        data(){
            return {
                loaded:false,
                changed:false,
                oldModel:null,
                filters:[]
            }
        },
        props: ['model','menuEditor'],
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
            onDelete(){
                this.$emit('delete');
            },
            onSubmit(evt) {
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
                return {
                    fields:[
                        {
                            model:'label',
                            type: "input",
                            inputType: "text",
                            label:'Заголовок'
                        },{
                            model:'priority',
                            type: "input",
                            inputType: "number",
                            label: 'Приоритет (меньше=раньше)'
                        },{
                            model:'rules',
                            type: "QueryBuilder",
                            styleClasses:'',
                            filters:this.filters,
                            allow_empty:true,
                            allow_invalid:false,
                            allow_groups:true
                        }
                    ],
                    groups:[
                        {
                            styleClasses:'mt-buttons',
                            fields:[
                                {
                                    "name":'deleteButton',
                                    "type": "submit",
                                    "buttonText": "Удалить",
                                    "onSubmit": _.bind(this.onDelete, this),
                                    validateBeforeSubmit: true,
                                    styleClasses: ' col-',
                                    fieldClasses: 'btn btn-outline-danger',
                                    visible:()=>{
                                        return !!this.model;
                                    }
                                },
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
                        }
                    ]
                };
            }
        },

        async created () {
            this.filters = _.map( await this.menuEditor.filters() ,(options)=>{
                return new CustomQueryFilter(options).filter()
            })
            console.log({filters:this.filters});
            this.loaded = true;
        }
    }
</script>