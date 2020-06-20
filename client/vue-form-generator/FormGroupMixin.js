import { get as objGet, isNil, isFunction } from "lodash";
import { slugifyFormID } from "./utils/schema";
import formMixin from "./formMixin.js";
import fieldComponents from "./utils/fieldsLoader.js";
import _ from 'underscore';
export default {
    name: "form-group",
    components: fieldComponents,
    mixins: [formMixin],
    props: {
        vfg: {
            type: Object,
            required: true
        },
        model: Object,
        options: {
            type: Object
        },
        field: {
            type: Object,
            required: true
        },
        errors: {
            type: Array,
            default() {
                return [];
            }
        },
        path:{
            type:String,
            default:''
        }
    },
    methods: {
        // Should field type have a label?
        fieldTypeHasLabel(field) {
            if (typeof(field.label)==='undefined'||isNil(field.label)||field.label==='')
                return false;

            let relevantType = "";
            if (field.type === "input") {
                relevantType = field.inputType;
            } else {
                relevantType = field.type;
            }

            switch (relevantType) {
                case "button":
                case "submit":
                case "reset":
                case "switch":
                case 'dropdown':
                    return false;
                default:
                    return true;
            }
        },
        getFieldID(schema) {
            if(this.path)
                return this.path;
            const idPrefix = _.chain([
                objGet(this, 'vfg.idPrefix', ""),
                objGet(this.options, "fieldIdPrefix", "")
            ]).map((prefix)=>{
                if(_.isFunction(prefix))
                    return prefix.apply(this,[schema]);
                return prefix;
            })
            .compact()
            .value()
            .join('-');
            return slugifyFormID(schema, idPrefix);
        },
        // Get type of field 'field-xxx'. It'll be the name of HTML element
        getFieldType(fieldSchema) {
            return "field-" + fieldSchema.type;
        },
        // Get type of button, default to 'button'
        getButtonType(btn) {
            return objGet(btn, "type", "button");
        },
        // Child field executed validation
        onFieldValidated(res, errors, field) {
            this.$emit("validated", res, errors, field);
        },
        buttonVisibility(field) {
            return field.buttons && field.buttons.length > 0;
        },
        buttonClickHandler(btn, field, event) {
            return btn.onclick.call(this, this.model, field, event, this);
        },
        // Get current hint.
        fieldHint(field) {
            if (isFunction(field.hint)) return field.hint.call(this, this.model, field, this);

            return field.hint;
        },
        fieldErrors(field) {
            return this.errors.filter((e) => e.field === field).map((item) => item.error);
        },
        onModelUpdated(newVal, schema) {
            this.$emit("model-updated", newVal, schema);
        },
        validate(calledParent) {
            return this.$refs.child.validate(calledParent);
        },
        clearValidationErrors() {
            if (this.$refs.child) {
                return this.$refs.child.clearValidationErrors();
            }
        },
        // eslint-disable-next-line no-unused-vars
        getFieldPath(field){
            return this.path;
        }
    },/*
    watch:{
        errors:{
            handler(newErrors,oldErrors){
                console.log(`field:${this.field.model}`,newErrors,oldErrors);
            }
        }
    },
*/
    computed:{
    }
};