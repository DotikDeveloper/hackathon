<template>
    <div :class="getFieldRowClasses(field)">
        <label v-if="fieldTypeHasLabel(field)" :for="getFieldID(field)" :class="labelClasses()">
            <span v-if="!hideLabel()" v-html="field.label"></span>
            <span v-if='field.help' class="help">
				<i class="icon"></i>
				<div class="helpText" v-html='field.help'></div>
			</span>
        </label>


        <component ref="child"
                   :is="getFieldType(field)"
                   :vfg="vfg"
                   :disabled="fieldDisabled(field)"
                   :model="model"
                   :schema="field"
                   :formOptions="options"
                   @model-updated="onModelUpdated"
                   @validated="onFieldValidated"
                   :path="path"
        ></component>
        <div v-if="buttonVisibility(field)" class="buttons">
            <button v-for="(btn, index) in field.buttons" @click="buttonClickHandler(btn, field, $event)"
                    :class="btn.classes" :key="index" v-text="btn.label" :type="getButtonType(btn)"></button>
        </div>

        <div v-if="field.hint" class="hint" v-html="fieldHint(field)"></div>

        <div v-if="fieldErrors(field).length > 0 && field.type!='object'" class="errors help-block">
            <span v-for="(error, index) in fieldErrors(field)" :key="index" v-html="error"></span>
        </div>
    </div>
</template>

<script>
    import Vue from 'vue';
    import FormGroupMixin from "../../FormGroupMixin";
    import _ from 'underscore';
    import {get as safeGet} from 'lodash';
    const bootstrapFormGroupMixin = _.clone(FormGroupMixin);
    const fieldComponents = {};
    import fieldCheckbox from "./fields/fieldCheckbox";
    fieldComponents.fieldCheckbox = fieldCheckbox;
    import fieldChecklist from './fields/fieldChecklist';
    fieldComponents.fieldChecklist = fieldChecklist;
    import fieldInput from './fields/fieldInput';
    fieldComponents.fieldInput = fieldInput;
    import fieldLabel from './fields/fieldLabel';
    fieldComponents.fieldLabel = fieldLabel;
    import fieldRadios from './fields/fieldRadios';
    fieldComponents.fieldRadios = fieldRadios;
    import fieldSelect from './fields/fieldSelect';
    fieldComponents.fieldSelect = fieldSelect;
    import fieldSubmit from './fields/fieldSubmit';
    fieldComponents.fieldSubmit = fieldSubmit;
    import fieldTextArea from './fields/fieldTextArea';
    fieldComponents.fieldTextArea = fieldTextArea;
    import fieldUpload from './fields/fieldUpload';
    fieldComponents.fieldUpload = fieldUpload;
    import fieldDateTimePicker from './fields/fieldDateTimePicker';
    fieldComponents.fieldDateTimePicker = fieldDateTimePicker;

    import fieldSwitch from "./fields/fieldSwitch";
    fieldComponents.fieldSwitch = fieldSwitch;

    import fieldDates from "./fields/fieldDates";
    fieldComponents.fieldDates = fieldDates;

    import fieldDropdown from "./fields/fieldDropdown";
    fieldComponents.fieldDropdown = fieldDropdown;

    bootstrapFormGroupMixin.components = fieldComponents;

    export default Vue.extend({
        mixins:[bootstrapFormGroupMixin],

        methods:{
            hideLabel(){
                let fType = String(this.field.type).toLowerCase();
                return ['switch'].indexOf(fType)>-1;
            },
            labelClasses(){
                let labelClasses = _.clone(this.field.labelClasses);
                if(!labelClasses)
                    labelClasses=[];
                if(_.isString(labelClasses))
                    labelClasses=[labelClasses];
                let type = String(this.field.type);
                if(type==='upload'&&labelClasses.indexOf('custom-file-label')==-1)
                    labelClasses.push('custom-file-label');

                let schemaLabelClasses = _.clone( safeGet(this.vfg,'schema.labelClass',[]) );
                if(!_.isArray(schemaLabelClasses)){
                    schemaLabelClasses=[schemaLabelClasses];
                }

                _.each(schemaLabelClasses,(schemaLabelClass)=>{
                    labelClasses.push(schemaLabelClass);
                });

                return labelClasses;
            }
        },

        computed:{
            componentName(){
                return 'BootstrapFormGroup';
            }
        }
    });
</script>

<style>
    .font-small{
        font-size:xx-small !important;
        margin-bottom: 0 !important;
    }
</style>