<template>
    <div class="vue-form-generator" v-if="schema != null && !schema.template">
        <fieldset v-if="schema.fields" :is='tag'>
            <template v-for='(field,index) in fields'>
                <component v-bind:is="formGroupComponent(schema)"
                            :key="index"
                            v-if='fieldVisible(field)'
                            :vfg="vfg"
                            :field="field"
                            :errors="errors"
                            :model="model"
                            :options="options"
                            @validated="onFieldValidated"
                            @model-updated="onModelUpdated"
                            :path="getFieldPath(field)"
                />
            </template>
        </fieldset>
        <template v-for='(group,gIndex) in groups'>
            <fieldset :is='tag' :key="gIndex" :class='getFieldRowClasses(group)'>
                <legend v-if='group.legend'>{{ group.legend }}</legend>
                <template v-for='(field,fIndex) in group.fields'>
                    <component v-bind:is="formGroupComponent(schema)"
                               :key="fIndex"
                               v-if='fieldVisible(field)'
                                :vfg="vfg"
                                :field="field"
                                :errors="errors"
                                :model="model"
                                :options="options"
                                @validated="onFieldValidated" @model-updated="onModelUpdated"
                                />
                </template>
            </fieldset>
        </template>
    </div>
    <div class="vue-form-generator" v-else-if='schema != null && schema.template'>
        <component v-bind:is="schemaComponent" :vfg="vfg" :errors="errors" :model="model"
                   :options="options"
                   :path="path"
                   @validated="onFieldValidated"
                   @model-updated="onModelUpdated"/>
    </div>
    <vue-loading v-else/>

</template>

<script>
    // eslint-disable-next-line no-unused-vars
    import { get as objGet, forEach, isFunction, isNil, isArray } from "lodash";
    import formMixin from "./formMixin.js";
    import formGroup from "./formGroup.vue";
    import _ from 'underscore';
    import {schemaComponentFactory,themes} from './vfgThemes';

    export default {
        name: "formGenerator",
        components: { formGroup },
        mixins: [formMixin],

        props: {
            schema: Object,

            model: Object,

            options: {
                type: Object,
                default() {
                    return {
                        validateAfterLoad: false,
                        validateAfterChanged: false,
                        fieldIdPrefix: "",
                        validationErrorClass: "error",
                        validationSuccessClass: ""
                    };
                }
            },

            multiple: {
                type: Boolean,
                default: false
            },

            isNewModel: {
                type: Boolean,
                default: false
            },

            tag: {
                type: String,
                default: "fieldset",
                validator: function(value) {
                    return value.length > 0;
                }
            },

            path:{
                type:String,
                default:''
            }
        },

        data() {
            return {
                vfg: this,
                errors: [], // Validation errors
                subscriptions:null,
                subscriptionsReady:false
            };
        },

        computed: {
            schemaComponent:schemaComponentFactory,
            fields() {
                let res = [];
                if (this.schema && this.schema.fields) {
                    forEach(this.schema.fields, field => {
                        if (!this.multiple || field.multi === true) res.push(field);
                    });
                }

                return res;
            },
            groups() {
                let res = [];
                if (this.schema && this.schema.groups) {
                    forEach(this.schema.groups.slice(0), group => {
                        res.push(group);
                    });
                }

                return res;
            }
        },

        watch: {
            // new model loaded
            model: {
                deep:true,
                handler: function (newModel, oldModel) {
                    if (oldModel === newModel)
                    // model property changed, skip
                        return;

                    if (newModel != null) {
                        this.$nextTick(() => {
                            // Model changed!
                            if (this.options.validateAfterLoad === true && this.isNewModel !== true) {
                                this.validate();
                            } else {
                                this.clearValidationErrors();
                            }
                        });
                    }
                }
            }
        },

        mounted() {
            this.$nextTick(() => {

                if (this.model) {
                    if (this.options.validateAfterLoad === true && this.isNewModel !== true) {
                        this.validate();
                    } else {
                        this.clearValidationErrors();
                    }
                }

            });
        },

        destroyed(){
            this.stopSubscriptions();
        },

        methods: {
            formGroupComponent(schema){
                let theme = schema.theme?themes[schema.theme]:themes.default;
                return theme.formGroup;
            },
            stopSubscriptions(){
                if(this.subscriptions){
                    _.each(this.subscriptions,(subscription)=>{
                        subscription.stop();
                    });
                    this.subscriptions=[];
                }
            },

            // Get visible prop of field
            fieldVisible(field) {
                if (isFunction(field.visible)) return field.visible.call(this, this.model, field, this);

                if (isNil(field.visible)) return true;

                return field.visible;
            },

            // Child field executed validation
            onFieldValidated(res, errors, field) {
                // Remove old errors for this field
                this.errors = this.errors.filter(e => e.field !== field.schema);

                if (!res && errors && errors.length > 0) {
                    // Add errors with this field
                    forEach(errors, err => {
                        this.errors.push({
                            field: field.schema,
                            error: err
                        });
                    });
                }

                let isValid = this.errors.length === 0;
                this.$emit("validated", isValid, this.errors, this);
            },

            onModelUpdated(newVal, schema) {
                this.$emit("model-updated", newVal, schema);
            },

            getVfgChildren(){
                if(this.schema && this.schema.template){
                    return _.chain(this.$children)
                    .pluck('$children')
                    .flatten()
                    .pluck('$children')
                    .flatten()
                    .value();
                }else{
                    return this.$children;
                }
            },
            validate() {
                this.clearValidationErrors();

                let fields = [];
                let results = [];

                forEach(this.getVfgChildren(), child => {
                    if (isFunction(child.validate)) {
                        fields.push(child.$refs.child); // keep track of validated children
                        let $childValidate = child.validate(true);
                        results.push($childValidate);
                    }
                });

                let resolved = null;

                let handleErrors = errors => {
                    let formErrors = [];
                    forEach(errors, (err, i) => {
                        if (isArray(err) && err.length > 0) {
                            forEach(err, error => {
                                formErrors.push({
                                    field: fields[i].schema,
                                    error: error
                                });
                            });
                        }
                    });
                    this.errors = _.clone( formErrors );
                    let isValid = formErrors.length === 0;
                    this.$emit("validated", isValid, formErrors, this);
                    setTimeout(()=>{
                        if(resolved)
                            console.log({resolved});
                    },0);
                    return formErrors;
                };
                resolved = Promise.all(results).then(handleErrors);
                return resolved;
            },

            // Clear validation errors
            clearValidationErrors() {
                this.errors.splice(0);

                forEach(this.getVfgChildren(), child => {
                    if(child.clearValidationErrors)
                        child.clearValidationErrors();
                });
            },
        }
    };
</script>

<style lang="scss">
    .vue-form-generator{
        user-select: none;
    }
    /*
    .vue-form-generator {
        * {
            box-sizing: border-box;
        }

        .form-control{
            // Default Bootstrap .form-control style
            display: block;
            &:not([class*=" col-"]) {
                width: 100%;
            }
            padding: 6px 12px;
            font-size: 14px;
            line-height: 1.42857143;
            color: #555;
            background-color: #fff;
            background-image: none;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);
            transition: border-color ease-in-out 0.15s, box-shadow ease-in-out 0.15s;
        } // .form-control

        span.help{
            margin-left: 0.3em;
            position: relative;

            .icon {
                display: inline-block;
                width: 16px;
                height: 14px;
                background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAA+UlEQVQ4ja3TS0oDQRAG4C8+lq7ceICICoLGK7iXuNBbeAMJuPVOIm7cqmDiIncIggg+cMZFaqCnZyYKWtB0df31V1VXdfNH6S2wD9CP8xT3KH8T9BiTcE7XBMOfyBcogvCFO9ziLWwFRosyV+QxthNsA9dJkEYlvazsQdi3sBv6Ol6TBLX+HWT3fcQZ3vGM5fBLk+ynAU41m1biCXvhs4OPBDuBpa6GxF0P8YAj3GA1d1qJfdoS4DOIcIm1DK9x8iaWeDF/SP3QU6zRROpjLDFLsFlibx1jJaMkSIGrWKntvItcyTBKzCcybsvc9ZmYz3kz9Ooz/b98A8yvW13B3ch6AAAAAElFTkSuQmCC");
                background-repeat: no-repeat;
                background-position: center center;
            } // .icon

            .helpText {
                background-color: #444;
                bottom: 30px;
                color: #fff;
                display: block;
                left: 0px;
                //margin-bottom: 15px;
                opacity: 0;
                padding: 20px;
                pointer-events: none;
                position: absolute;
                text-align: justify;
                width: 300px;
                //transform: translateY(10%);
                transition: all 0.25s ease-out;
                box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.5);
                border-radius: 6px;

                a {
                    font-weight: bold;
                    text-decoration: underline;
                } // a
            } // .helpText

            .helpText:before {
                bottom: -20px;
                content: " ";
                display: block;
                height: 20px;
                left: 0;
                position: absolute;
                width: 100%;
            }

            &:hover .helpText {
                opacity: 1;
                pointer-events: auto;
                transform: translateY(0px);
            }
        } // span.help

        .field-wrap {
            display: flex;

            .buttons {
                white-space: nowrap;
                margin-left: 4px;
            }

            button,input[type="submit"] {
                // Default Bootstrap button style
                display: inline-block;
                padding: 6px 12px;
                margin: 0px;
                font-size: 14px;
                font-weight: normal;
                line-height: 1.42857143;
                text-align: center;
                white-space: nowrap;
                vertical-align: middle;
                touch-action: manipulation;
                cursor: pointer;
                user-select: none;
                color: #333;
                background-color: #fff;
                border: 1px solid #ccc;
                border-radius: 4px;

                &:not(:last-child) {
                    margin-right: 4px;
                }

                &:hover {
                    color: #333;
                    background-color: #e6e6e6;
                    border-color: #adadad;
                }

                &:active {
                    color: #333;
                    background-color: #d4d4d4;
                    border-color: #8c8c8c;
                    outline: 0;
                    box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);
                }

                &:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            } // button, input[submit]
        } // .field-wrap

        .hint {
            font-style: italic;
            font-size: 0.8em;
        } // .hint
    } // fieldset

     */
</style>
