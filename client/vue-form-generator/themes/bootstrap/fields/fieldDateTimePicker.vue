<template lang="pug">
    .input-group.date
        input.form-control(type="text", v-model="value", :autocomplete="schema.autocomplete", :disabled="disabled", :placeholder="schema.placeholder", :readonly="schema.readonly", :name="schema.inputName", :id="getFieldID(schema)")
        span.input-group-addon
            span.material-icons.calendar_today
</template>

<script>
    /* global $ */
    import abstractField from "../../../fields/abstractField";
    import {defaults} from "lodash";
    import dateFieldHelper from "../../../utils/dateFieldHelper";
    let inputFormat = "YYYY-MM-DD HH:mm:ss";

    export default {
        mixins: [abstractField],

        methods: {
            getDateFormat () {
                if (this.schema.dateTimePickerOptions && this.schema.dateTimePickerOptions.format)
                    return this.schema.dateTimePickerOptions.format;
                else return inputFormat;
            },

            formatValueToField(value){
                if(this.schema.formatValueToField)
                    return this.schema.formatValueToField.apply(this,[value]);
                return dateFieldHelper.formatValueToField.apply(this,[value]);
            },

            formatValueToModel(value){
                if(this.schema.formatValueToModel)
                    return this.schema.formatValueToModel.apply(this,[value]);
                return dateFieldHelper.formatValueToModel.apply(this,[value]);
            }
        },

        mounted () {
            this.$nextTick (function () {
                if (window.$ && window.$.fn.datetimepicker) {
                    let input = this.$el.querySelector (".form-control");
                    let datePickerOptions = defaults (this.schema.dateTimePickerOptions || {}, {
                        format: inputFormat,
                        icons: {
                            time: 'fa fa-clock-o',
                            date: 'fa fa-calendar',
                            up: 'fa fa-chevron-up',
                            down: 'fa fa-chevron-down',
                            previous: 'fa fa-chevron-left',
                            next: 'fa fa-chevron-right',
                            today: 'fa fa-dot-circle-o',
                            clear: 'fa fa-trash',
                            close: 'fa fa-times'
                        },
                        locale: 'ru'
                    });
                    $ (this.$el)
                    .datetimepicker (
                        datePickerOptions
                    )
                    .on ("dp.change", () => {
                        console.log('input.value:',input.value);
                        if(!input.value){
                            this.value = null;
                        }else
                            this.value = input.value;
                    });
                } else {
                    console.warn (
                        "Bootstrap datetimepicker library is missing. Please download from https://eonasdan.github.io/bootstrap-datetimepicker/ and load the script and CSS in the HTML head section!"
                    );
                }
            });
        },

        beforeDestroy () {
            console.log('destroy',this.schema.model,'$componentID:',this.$componentID);
            if (window.$ && window.$.fn.datetimepicker) {
                try {
                    $ (this.$el)
                    .data ("DateTimePicker")
                    .destroy ();
                    // eslint-disable-next-line no-empty
                }catch (e) {

                }
            }
        },

        computed:{
        }
    };
</script>


<style>
    .material-icons.calendar_today:before {
        content: 'calendar_today';
    }
</style>
