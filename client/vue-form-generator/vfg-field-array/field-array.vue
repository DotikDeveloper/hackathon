<template>
    <div :id="fieldId" :class="rootCssClass" v-if="schema" style="padding-left:3%;">
        <div :key=index v-for="(item, index) in value" :class="schema.itemContainerClasses">

                <span style="margin-left: 90%;">
                    <button
                            :class="schemaProp2ButtonClass('moveElementUpButtonClasses')"
                            @click="moveElementUp(index)"
                            v-if="showButton('showModeElementUpButton')"
                            title='Переместить выше'
                    >{{moveElementUpButtonLabel}}
                    </button>
                    <button
                            :class="schemaProp2ButtonClass('moveElementDownButtonClasses')"
                            @click="moveElementDown(index)"
                            v-if="showButton('showModeElementDownButton')"
                            title='Переместить ниже'
                    >{{moveElementDownButtonLabel}}</button>

                    <button
                            :class="schemaProp2RemoveButtonClass('removeElementButtonClasses')"
                            @click="removeElement(index)"
                            v-if="showButton('showRemoveButton')"
                            title='Удалить элемент'
                    >{{removeElementButtonLabel}}</button>
                </span>

            <span v-if="schema.items && schema.itemContainerComponent">
                <component
                        :is='schema.itemContainerComponent'
                        :model='item'
                        :index="index"
                        :path="getFieldPath(index)"
                        :id="fieldId + 'c' + index"
                        :parentId="fieldId"
                        :removeElementButtonLabel="removeElementButtonLabel"
                        :moveElementUpButtonLabel="moveElementUpButtonLabel"
                        :moveElementDownButtonLabel="moveElementDownButtonLabel"
                        :itemContainerHeader="schema.itemContainerHeader"
                        :schema='generateSchema(value, schema.items, index)'
                        @moveItemUp="moveElementUp(index)"
                        @moveItemDown="moveElementDown(index)"
                        @removeItem='removeElement(index)'
                        @model-updated='modelUpdated'
                >
                  <component
                          :is='getFieldType(schema.items)'
                          :model='item'
                          :path="getFieldPath(index)"
                          :schema='generateSchema(value, schema.items, index)'
                          :formOptions='formOptions'
                          @model-updated='modelUpdated'/>
                </component>
            </span>

            <span v-else-if="schema.items">
                <component
                        :is='getFieldType(schema.items)'
                        :model='item'
                        :schema='generateSchema(value, schema.items, index)'
                        :formOptions='formOptions'
                        @model-updated='modelUpdated'
                        :path="getFieldPath(index)"
                />
            </span>
            <span v-else-if="schema.itemContainerComponent">
                <component
                        :is='schema.itemContainerComponent'
                        :model='item'
                        :index="index"
                        :id="fieldId + 'c' + index"
                        :parentId="fieldId"
                        :removeElementButtonLabel="removeElementButtonLabel"
                        :moveElementUpButtonLabel="moveElementUpButtonLabel"
                        :moveElementDownButtonLabel="moveElementDownButtonLabel"
                        :itemContainerHeader="schema.itemContainerHeader"
                        :schema='generateSchema(value, schema.items, index)'
                        @moveItemUp="moveElementUp(index)"
                        @moveItemDown="moveElementDown(index)"
                        @removeItem='removeElement(index)'
                        :path="getFieldPath(index)"
                >
                  <input type="text"
                         v-model="value[index]"
                         :class="schema.itemFieldClasses"
                         :name='generateInputName(index)'
                         :id="fieldId + index"
                         @input="onInput"
                  />
                  <input
                          type="button"
                          :value="removeElementButtonLabel"
                          @click="removeElement(index)"
                          v-if='schema.showRemoveButton'/>
                </component>
            </span>

            <input type="text" v-model="value[index]" :class="schema.itemFieldClasses"
                   :name='generateInputName(index)' :id="fieldId + index"
                   :path="getFieldPath(index)"
                   @input="onInput"
                   v-else/>

        </div>
        <button
                v-if="showButton('showNewElementButton')"
                style="margin-top:1em;"
                :class="schemaProp2ButtonClass('newElementButtonLabelClasses')"
                @click="newElement"
                title='Добавить элемент'
        >{{newElementButtonLabel}}</button>
    </div>
</template>

<script>
    import abstractField from './../fields/abstractField';
    import fieldComponents from './../utils/fieldsLoader';

    import {
        isFunction,isArray,isString,forEach,cloneDeep
    } from 'lodash';
    import Vue from "vue";
    import _ from 'underscore';

    export default {
        components: fieldComponents,
        mixins: [abstractField],
        computed: {
            rootCssClass(){
                let result = this.addCssClass(this.schema.fieldClasses);
                if(!this.schema.disableBorderLeft){
                    result.addCssClass('border-left');
                }
                return  result;
            },
            fieldId() {
                return this.getFieldID(this.schema);
            },
            newElementButtonLabel() {
                if (typeof this.schema.newElementButtonLabel !== "undefined") {
                    return this.schema.newElementButtonLabel;
                }
                return "add";
            },
            removeElementButtonLabel() {
                if (typeof this.schema.removeElementButtonLabel !== "undefined") {
                    return this.schema.removeElementButtonLabel;
                }

                return "close";
            },
            moveElementUpButtonLabel() {
                if (typeof this.schema.moveElementUpButtonLabel !== "undefined") {
                    //removeElementButtonLabel();
                    return this.schema.moveElementUpButtonLabel;
                }

                return "arrow_upward";
            },
            moveElementDownButtonLabel() {
                if (typeof this.schema.moveElementDownButtonLabel !== "undefined") {
                    return this.schema.moveElementDownButtonLabel;
                }

                return "arrow_downward";
            },
        },
        methods: {
            showButton(prop){
                return (
                    this.schema[prop]||typeof this.schema[prop]=="undefined"
                    && (prop==='showRemoveButton'||prop==='showNewElementButton'||_.size(this.value)>1)
                );
            },
            schemaProp2RemoveButtonClass(propName){
                let classes = this.schemaProp2ButtonClass(propName);
                if(_.isArray(classes)){
                    classes.push('vfg-array-remove-button');
                }
                return classes;
            },
            schemaProp2ButtonClass(propName){
                let val = this.schema[propName];
                if(val){
                    if(_.isString(val))
                        val = [val];
                    val = _.clone(val);
                }else {
                    val = [];
                }
                if(_.isArray(val) ){
                    if(val.indexOf('vfg-array-button')==-1)
                        val.push('vfg-array-button');
                    if(val.indexOf('material-icons')==-1)
                        val.push('material-icons');
                }
                return val;
            },
            generateSchema(rootValue, schema, index) {
                let newSchema = {...schema};

                if (typeof this.schema.inputName !== "undefined") {
                    newSchema.inputName = this.schema.inputName + "[" + index + "]";
                }

                if(newSchema&&this.vfg){
                    _.each(['fieldClasses','formGroupClass','labelClass','theme'],(propKey)=>{
                        if(this.vfg.schema&&this.vfg.schema[propKey]&&newSchema[propKey]===undefined)
                            newSchema[propKey] = this.vfg.schema[propKey]
                    });
                }

                newSchema.id = this.fieldId + index;
                return {
                    ...newSchema,
                    set(model, value) {
                        Vue.set(rootValue, index, value);
                    },
                    // eslint-disable-next-line no-unused-vars
                    get(model) {
                        return rootValue[index];
                    }
                };
            },
            generateInputName(index) {
                if (typeof this.schema.inputName === "undefined") {
                    return null;
                }

                return this.schema.inputName + "[" + index + "]";
            },
            newElement() {
                let value = this.value;
                let itemsDefaultValue = undefined;

                if (!value || !value.push) value = [];

                if (this.schema.items && this.schema.items.default) {
                    itemsDefaultValue = cloneDeep(this.schema.items.default);
                }

                value.push(itemsDefaultValue);

                this.value = [...value];
            },
            removeElement(index) {
                this.value.splice(index, 1);
                this.modelUpdated(this.value,this.schema);
            },
            moveElementDown(index) {
                let to = index + 1;
                if (to >= this.value.length) {
                    to = 0;
                }
                this.value.splice(to, 0, this.value.splice(index, 1)[0]);
                this.modelUpdated(this.value,this.schema);
            },
            moveElementUp(index) {
                let to = index - 1;
                if (to < 0) {
                    to = this.value.length;
                }
                this.value.splice(to, 0, this.value.splice(index, 1)[0]);
                this.modelUpdated(this.value,this.schema);
            },
            getFieldType(fieldSchema) {
                return "field-" + fieldSchema.type;
            },
            modelUpdated(model, schema) {
                this.$emit("model-updated", model, schema);
            },
            validate(calledParent) {
                this.clearValidationErrors();
                let results = [];

                forEach(this.$children, child => {
                    if (isFunction(child.validate)) {
                        results.push(child.validate(true));
                    }
                });

                let handleErrors = errors => {
                    let fieldErrors = [];
                    forEach(errors, err => {
                        if (isArray(err) && err.length > 0) {
                            forEach(err, singleErr => {
                                fieldErrors.push(singleErr);
                            });
                        } else if (isString(err)) {
                            fieldErrors.push(err);
                        }
                    });
                    if (isFunction(this.schema.onValidated)) {
                        this.schema.onValidated.call(
                            this,
                            this.model,
                            fieldErrors,
                            this.schema
                        );
                    }

                    let isValid = fieldErrors.length == 0;
                    if (!calledParent) {
                        this.$emit("validated", isValid, fieldErrors, this);
                    }
                    this.errors = fieldErrors;
                    return fieldErrors;
                };

                return Promise.all(results).then(handleErrors);
            },
            onInput(){
                this.modelUpdated(this.value,this.schema);
            },
            // eslint-disable-next-line no-unused-vars
            getFieldPath(index){
                return [
                    this.path,
                    index
                ].join('.')
            }
        }
    };
</script>

<style>
    .vfg-array-button{
        color: #fff;
        background-color: #337ab7;
        display: inline-block;
        padding: 4px 8px;
        margin-bottom: 0;
        font-size: 14px;
        font-weight: normal;
        line-height: 1.42857143;
        text-align: center;
        white-space: nowrap;
        vertical-align: middle;
        cursor: pointer;
        user-select: none;
        background-image: none;
        border: 1px solid transparent;
        border-radius: 4px;
    }

    .vfg-array-remove-button{
        background-color: #dc3545 !important;
    }
</style>