import Enum from '/lib/Enum';
import {get as safeGet} from 'lodash';
import {formatDate} from "./utils";
import _ from 'underscore';
import $ from 'jquery';

export default
class DateQuery{
    constructor(options){
        this.mode = options.mode;
        this.id = options.id;
        this.label = options.label;
    }

    static parse(s,mode,now=new Date()){
        let from = null, to = null;
        if(s) {
            let rulesData = JSON.parse(s);

            _.each(rulesData, function (itemData, index) {
                let dateMode = safeGet(itemData, 'mode', DateQuery.DateMode.abs.key);
                let date;
                if (dateMode === DateQuery.DateMode.abs.key) {
                    let dateString = itemData.values[0];
                    if (mode === DateQuery.Mode.date.key)
                        dateString += ' 00:00';
                    date = new Date(dateString);
                } else {
                    date = new Date(now);
                    let days = Number(itemData.values[0]);
                    let hours = Number(itemData.values[1]);
                    date.setDate(date.getDate() + days);
                    let ts = date.getTime() + hours * 3600 * 1000;
                    date = new Date(ts);
                }

                let fDate, tDate;
                if (mode === DateQuery.Mode.date.key) {
                    fDate = new Date(formatDate(date, 'YYYY-MM-DD') + ' 00:00:00');
                    tDate = new Date(formatDate(date, 'YYYY-MM-DD') + ' 23:59:59');
                } else {
                    fDate = date;
                    tDate = new Date(date.getTime()+59*1000);
                }

                if (index === 0) {
                    from = fDate;
                    to = tDate;
                } else
                    to = tDate;
            });
        }
        return {from:from,to:to};
    }

    filter(){
        const self = this;
        return {
            id: this.id,
            label:this.label,
            type: 'string',
            operators: ['equal','not_equal','less','less_or_equal','greater','greater_or_equal','between','not_between','is_null','is_not_null'],
            validation: {
                // eslint-disable-next-line no-unused-vars
                callback:function(value,rule){
                    if(!value)
                        return 'Укажите значение';
                    let err = null;
                    try{
                        let data = JSON.parse(value);
                        _.each(data,(itemData)=>{
                            let dateMode = itemData.mode;
                            if (dateMode === DateQuery.DateMode.abs.key && !itemData.values[0]) {
                                err = 'Укажите дату';
                            }
                        });
                    }catch(e){
                        err=e;
                    }
                    return err?err:true;
                }
            },
            input: function(rule, name) {
                let mode_name = `${name}_datemode`;
                let container_name = `${name}_container`;
                let child_rel = `${name}_rel`;
                let child_abs = `${name}_abs`;
                let date_abs = `${name}_absdate`;

                let $container = rule.$el.find('.rule-value-container');

                let changed = function(field){
                    let datemode = $(`[name=${mode_name}]`).val();
                    if(field==='datemode') {
                        if (datemode === DateQuery.DateMode.abs.key) {
                            $(`#${child_abs}`).html(
                                `<div class='input-group date' id='${date_abs}' style="max-width:200px;">
                                  <input type='text' class="form-control" name="${date_abs}"/>
                                  <span class="input-group-addon">
                                    <span class="glyphicon glyphicon-calendar"></span>
                                  </span>
                                </div>`
                            );
                            $(`#${date_abs}`).datetimepicker({
                                format: self.mode === DateQuery.Mode.datetime.key ?  'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD',
                                locale: 'ru'
                            });
                            $(`#${child_rel}`).html('');
                        } else {
                            let html = `<input type="number" style="max-width:50px;" id="${name}_days" name="${name}_days" value="1" size="2"/>
                                <label for="${name}_days">Дней</label>`;
                            if(self.mode===DateQuery.Mode.datetime.key)
                                html+=`<input type="number" style="max-width:50px;" min="-23" max="23" id="${name}_hours" name="${name}_hours" value="1" size="2"/>
                                <label for="${name}_hours">Часов</label>`;

                            $(`#${child_rel}`).html(html);
                            $(`#${child_abs}`).html('');
                        }
                    }
                };

                $container.on('change', `[name=${mode_name}]`, function(){
                    changed('datemode');
                });
                $container.on('_change', `[name=${mode_name}]`, function(){
                    changed('datemode');
                });
                setTimeout(()=>{
                    changed('datemode');
                },0);

                return `<div class="valuecontainer" id="${container_name}" data-field-name="${name}">
                    <select name="${mode_name}"> 
                        <option value="abs">Абсолютно</option><option value="rel">Относительно</option> 
                    </select>
                    
                    <div id="${child_rel}"></div>
                    
                    <div id="${child_abs}"></div>
                </div>`;
            },

            valueGetter: function(rule) {
                let result = [];
                // eslint-disable-next-line no-unused-vars
                rule.$el.find(`.valuecontainer`).each(function( index ) {
                    let $this = $( this );
                    let datemode = $this.find(`[name$=_datemode]`).val();
                    if(datemode===DateQuery.DateMode.rel.key){
                        let days = $this.find(`[name$=_days]`).val() || 0;
                        let hours = $this.find(`[name$=_hours]`).val() || 0;

                        result.push( {mode:datemode,values:[days,hours] } );
                    }else{
                        result.push( {mode:datemode,values:[$this.find(`[name$=_absdate]`).val()] } );
                    }
                });
                return JSON.stringify(result);
            },
            valueSetter: function(rule, value) {
                setTimeout(()=> {
                    if(value) {
                        let data = JSON.parse(value);

                        _.each(data, function (itemData, index) {
                            let dateMode = itemData.mode;
                            let $container = $(rule.$el.find(`[data-field-name$=_${index}]`)[0]);
                            $container.find(`[name$=_datemode]`).val(dateMode);
                            if (dateMode === DateQuery.DateMode.abs.key) {
                                $container.find(`[name$=_absdate]`).val(itemData.values[0] || '');
                            } else {
                                $container.find(`[name$=_datemode]`).trigger('_change');
                                $container.find(`[name$=_days]`).val(itemData.values[0] || '0');
                                $container.find(`[name$=_hours]`).val(itemData.values[1] || '0');
                            }
                        });
                    }
                },0);
            }
        }
    }
}

/**
 * @category QueryBuilder
 * @deprecated
 * @name VAR_MODE
 * @property {object} date
 * @property {string} date.key
 * @property {string} date.value
 * @property {object} datetime
 * @property {string} datetime.key
 * @property {string} datetime.value
 **/
DateQuery.Mode = new Enum({
    date:'Дата',
    datetime:'Время'
});

/**
 * @category QueryBuilder
 * @name DateMode
 * @property {object} abs
 * @property {string} abs.key
 * @property {string} abs.value
 * @property {object} Number
 * @property {string} rel.key
 * @property {string} rel.value
 * */
DateQuery.DateMode = new Enum({
    abs:'Абсолютно',
    rel:'Относительно'
});

DateQuery.delimiter = '&';
DateQuery.join = '|';