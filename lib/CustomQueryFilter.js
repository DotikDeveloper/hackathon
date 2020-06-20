import {FILTER_MODE} from "./enums";
import {VAR_TYPES} from "../modules/menu/enums";
import DateQuery from "./DateQuery";
import $ from 'jquery';
import _ from 'underscore';
import {get as safeGet,isFinite} from 'lodash';

/**
 * @category lib
 * @property {string} label
 * @property {string} id
 * @property {string} type
 * @property {string} mode
 * @property {string[]} variables
 * */

/**
 * @typedef {Object} CustomQueryFilterOptions
 * @property {string} label Отображаемый текст
 * @property {string} id ID
 * @property {string?} field Имя свойства
 * @property {string} vartype Тип переменной @see {VAR_TYPES}
 * @property {string} mode Дополнительный режим обработки условий @see {DateQuery}
 * */

export default class CustomQueryFilter{
    constructor(options){
        this.label = options.label;
        this.id = options.id;
        this.field = options.field || this.id;
        this.vartype = options.type || VAR_TYPES.String.key;// == MenuItems.VAR_MODE.Number.key ? 'number' : 'text';
        this.mode = options.mode;
        this.variables = (()=>{
            if(!_.isArray(options.variables))
                return [];
            return options.variables;
        })();


        this.operators = options.operators;
        if(!this.operators){
            this.operators = CustomQueryFilter.getDefaultOperators(this.vartype);
        }
        this.customInput = options.customInput ? options.customInput : true;
    }

    filter(){
        let self = this;
        let type = 'string';
        if(this.vartype==VAR_TYPES.Number.key){
            type = 'double';
        }
        if(this.vartype==VAR_TYPES.Boolean.key){
            type = 'boolean';
        }

        let result = {
            id: this.id,
            field:this.field,
            label:this.label,
            type: type,
            operators: this.operators,
            validation: {
                // eslint-disable-next-line no-unused-vars
                callback:function(value,rule){
                    if(!value)
                        return 'Укажите значение';
                    let err = null;
                    try {
                        let data = JSON.parse(value);
                        // eslint-disable-next-line no-unused-vars
                        _.each(data, function (itemData, index) {
                            if (!err) {
                                let dateMode = itemData.mode || DateQuery.DateMode.abs.key;
                                let values = itemData.values || [];
                                if (dateMode === DateQuery.DateMode.abs.key && !values[0]) {
                                    err = 'Укажите дату';
                                }
                            }
                        });
                    }catch(e){
                        return e;
                    }
                    return err ? err : true;
                }
            },
        };

        if(this.customInput){
            result.validation = {
                // eslint-disable-next-line no-unused-vars
                callback:function(value,rule){//TODO
                    if(!value)
                        return 'Укажите значение';
                    let err = null;
                    let data = JSON.parse(value);

                    // eslint-disable-next-line no-unused-vars
                    _.each(data, function (itemData, index) {
                        if(!err) {
                            let dateMode = itemData.mode || DateQuery.DateMode.abs.key;
                            let values = itemData.values || [];
                            if (dateMode === DateQuery.DateMode.abs.key && !values[0]) {
                                err = 'Укажите дату';
                            }
                        }
                    });
                    return err ? err : true;
                }
            };

            result.input = (rule, name)=>{
                let mode_name = `${name}_mode`;
                let value_name = function(mode){
                    return `${name}_${mode}_value`;
                };
                let container_name = `${name}_container`;
                let filterModeHtml = `<select name="${mode_name}"> `;

                _.each(_.size(self.variables)>0?FILTER_MODE.data:FILTER_MODE.exclude([FILTER_MODE.variable.key]).data,function(enumItem){
                    filterModeHtml+=`<option value="${enumItem.key}">${enumItem.label}</option>`;
                });
                filterModeHtml+='</select>';

                let inputsHtml = '';
                inputsHtml += `<select name="${value_name(FILTER_MODE.variable.key)}" style="${this.mode!=FILTER_MODE.variable.key?'display:none;':''}">`;
                _.each(self.variables, function (variable) {
                    if(_.isString(variable)) {
                        inputsHtml += `<option value="${variable}">${variable}</option>`;
                    }else{
                        inputsHtml += `<option value="${variable.name}">${variable.label}</option>`;
                    }
                });
                inputsHtml += `</select>`;



                if(self.vartype===VAR_TYPES.Boolean.key){
                    inputsHtml += `<select class="form-control" name="${value_name(FILTER_MODE.value.key)}" 
                    style="${this.mode!=FILTER_MODE.variable.key?'display:none;':''}">
                    <option value="true">TRUE</option>
                    <option value="false">FALSE</option>
                    </select>
                    `;
                }else{
                    let $inputType = this.vartype ===  VAR_TYPES.Number.key ? 'number' : 'text';
                    inputsHtml+=`<input class="form-control" type="${$inputType}" name="${value_name(FILTER_MODE.value.key)}" 
                    style="${this.mode!==FILTER_MODE.value.key?'display:none;':''}">`
                }
                inputsHtml+=`<textarea class="custom-query-field-expression" style="${this.mode!=FILTER_MODE.expression.key?'display:none;':'resize: both;'}" rows="5" cols="30" 
                    name="${value_name(FILTER_MODE.expression.key)}"></textarea>`;

                return `<div class="valuecontainer" id="${container_name}" data-field-name="${name}">
                        ${filterModeHtml}
                    <div class="inputs">
                        ${inputsHtml}
                    </div>
                </div>`;
            };

            result.valueGetter=function(rule) {
                let result = [];
                // eslint-disable-next-line no-unused-vars
                rule.$el.find(`.valuecontainer`).each(function( index ) {
                    let $this = $( this );
                    let mode = $this.find(`[name$=_mode]`).val();
                    _.each(FILTER_MODE.keys,function(_mode){
                        let $el = $this.find(`[name$=_${_mode}_value]`);
                        (_mode===mode) ? $el.show() : $el.hide();
                    });
                    let value = $this.find(`[name$=_${mode}_value]`).val();
                    if(self.vartype===VAR_TYPES.Number.key){
                        if(value==='')
                            value = null;
                        if(!isNaN(value))
                            value = Number(value);
                    }
                    //console.log(`field:${self.field}, vartype:${self.vartype} value:`,value,',type:',typeof value,'isFinite(value):',isFinite(value));
                    result.push({mode:mode,values:[value]});
                });
                //console.log('valueGetter:',JSON.stringify(result));
                return JSON.stringify(result);
            };

            result.valueSetter=function(rule, value) {
                if(typeof value=='undefined')
                    value = '';
                if(value) {
                    //console.log('valueSetter:',value);
                    let data = JSON.parse(value);
                    //console.log({data});
                    _.each(data,(itemData)=>{
                        let mode = safeGet(itemData, 'mode', FILTER_MODE.value.key);
                        let values = safeGet(itemData, 'values',[]);
                        rule.$el.find(`[name$=_mode]`).val(mode);
                        rule.$el.find(`[name$=_${mode}_value]`).val(values[0]);
                        rule.$el.find(`[name$=_mode]`).trigger('change');
                        rule.$el.find(`[name$=_${mode}_value]`).val(values[0]);
                    });
                }
            }
        }

        return result;
    }

    static getDefaultOperators(vartype){
        switch (vartype) {
            case VAR_TYPES.String.key:
                return ['equal','not_equal','in','not_in','begins_with','not_begins_with','contains','not_contains','ends_with','not_ends_with','is_empty','is_not_empty','is_null','is_not_null'];
            case VAR_TYPES.Number.key:
                return  ['equal','not_equal','in','not_in','less','less_or_equal','greater','greater_or_equal','between','not_between','is_null','is_not_null'];
            case VAR_TYPES.Date.key:
                return  ['equal','not_equal','less','less_or_equal','greater','greater_or_equal','between','not_between','is_null','is_not_null'];
            case VAR_TYPES.Boolean.key:
                return  ['equal','not_equal'];
            case VAR_TYPES.Object.key:
                return ['is_null','is_not_null'];
            default:
                return ['is_null','is_not_null'];
        }
    }
}