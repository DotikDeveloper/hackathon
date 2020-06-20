<template>
    <div class="wrapper">
        <YearCalendar
                v-model="year"
                :activeDates.sync="valuesForView"
                @toggleDate="toggleDate"
                lang="ru"
                :showYearSelector="showYearSelector"
                isUsingString="true"
        ></YearCalendar>
    </div>
</template>

<script>
    import abstractField from "../../../fields/abstractField";
    import YearCalendar from 'vue-material-year-calendar'
    import {get as safeGet} from 'lodash';
    import EJSON from 'ejson';
    import moment from 'moment';
    import _ from 'underscore';

    export default {
        components: { YearCalendar },
        mixins: [abstractField],

        computed: {
            year(){
                return safeGet(this.schema,'year')||new Date().getFullYear();
            },
            showYearSelector(){
                return safeGet(this.schema,'showYearSelector',true);
            },
            valuesForView:{
                get(){
                    if(!this.schema.format||_.isEmpty(this.value))
                        return this.value;
                    let converted = _.map(this.value,(date)=>{
                        return moment(date,this.schema.format).format('YYYY-MM-DD');
                    });
                    console.log({converted});
                    return converted;
                },
                set(newValues){
                    if(!this.schema.format||_.isEmpty(newValues))
                        this.value = newValues;
                    let converted = _.map(newValues,(date)=>{
                        return moment(date,'YYYY-MM-DD').format(this.schema.format);
                    });
                    if(!EJSON.equals(this.value,converted))
                        this.value = converted;
                }
            }
        },

        methods: {
            // eslint-disable-next-line no-unused-vars
            toggleDate (dateInfo) {
            }
        }
    };
</script>

