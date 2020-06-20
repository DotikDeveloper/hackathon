import BootstrapFormGroup from './themes/bootstrap/FormGroup';
import DefaultFormGroup from './formGroup';
import Vue from 'vue';
import _ from 'underscore';

const themes = {
    bootstrap:{
        formGroup:BootstrapFormGroup,
    },
    default:{
        formGroup:DefaultFormGroup
    }
};

function schemaComponentFactory(){
    if(!this.schema||!this.schema.template)
        return  null;
    let themeName = this.schema.theme || 'default';
    const theme = themes[themeName];

    let components = {
        'vfgField':Vue.extend ({
            name:'VfgField',
            template: `<form-group v-if="fieldVisible(field)" :vfg="vfg" :field="field"
                                ref="child"   
                                :errors="$parent.errors" :model="$parent.model"
                                :options="$parent.options" @validated="$parent.onFieldValidated"
                                @model-updated="$parent.onModelUpdated"
                                :path="getFieldPath(field)"   
            />`,
            props:{
                for:{
                    type: String,
                    required: true
                },
                path:{
                    type:String,default:''
                }
            },
            components:{
                'formGroup':theme.formGroup
            },
            created () {
            },
            computed:{
                fieldIndex(){
                    let fieldsData = _.chain(this.vfg.schema.fields)
                        .map((field,index)=>{
                            return {
                                field,
                                index
                            }
                        })
                        .filter((_fieldItem)=>{
                            return _fieldItem.field.model === this.for || _fieldItem.field.name === this.for;
                        })
                        .value();
                    if(_.isEmpty(fieldsData))
                        return null;
                    if(_.size(fieldsData)===1)
                        return _.first(fieldsData).index;
                    else{
                        let visibleItem = _.find(fieldsData,(_fieldItem)=>{
                            return this.$parent.fieldVisible(_fieldItem.field);
                        });
                        return visibleItem?visibleItem.index:_.first(fieldsData).index;
                    }
                },
                field(){
                    return this.vfg.schema.fields[this.fieldIndex];
                },
                vfg(){
                    return this.$parent.vfg;
                },
                options(){
                    return this.$parent.options;
                }
            },
            methods:{
                fieldVisible(field){
                    return this.$parent.fieldVisible(field);
                    // eslint-disable-next-line no-unused-vars
                },getFieldPath(field){
                    return _.compact([
                        this.$parent.path,
                        field.model
                    ]).join('.');
                }
            }
        })
    };

    return Vue.extend({
        template:this.schema.template,
        components:components,
        props: {
            vfg: {
                type: Object,
                required: true
            },
            model: Object,
            options: {
                type: Object
            },
            errors: {
                type: Array,
                default() {
                    return [];
                }
            },
            path:{
                type:String,default:''
            }
        },
        methods:{
            onFieldValidated(res, errors, field) {
                this.$emit("validated", res, errors, field);
            },
            onModelUpdated(newModel,schema){
                this.$emit("model-updated", newModel,schema);
            },
            fieldVisible(field){
                if(_.isString(field)){
                    return _.chain(this.vfg.schema.fields)
                    .filter((_field)=>{
                        return _field.model === field;
                    })
                    .map((field)=>{
                        return this.vfg.fieldVisible(field);
                    })
                    .some()
                    .value();
                }
                const result = this.vfg.fieldVisible(field);
                //console.log(`fieldVisible(${field}):${result}`);
                return result;
            },
            async validate(calledParent) {
                let promises = [];
                _.each(this.$children,($vfgField)=>{
                    if($vfgField.$refs.child && $vfgField.$refs.child.validate ){
                        promises.push($vfgField.$refs.child.validate(calledParent));
                    }
                });
                let errors = await Promise.all(promises);
                errors = _.flatten(errors);
                return errors;
            },
            clearValidationErrors() {
                _.each(this.$children, $vfgField => {
                    if($vfgField.$refs.child && $vfgField.$refs.child.clearValidationErrors ){
                        $vfgField.$refs.child.clearValidationErrors();
                    }
                });
            }
        }
    });
}

export {
    themes,
    schemaComponentFactory
}