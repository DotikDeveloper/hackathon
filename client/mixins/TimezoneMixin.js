import Vue from 'vue';
import {get as safeGet} from 'lodash';
import moment from 'moment';
const serverTz = 'Europe/Moscow';

Vue.mixin ({

    methods: {
        safeGet (prop, defaultValue) {
            return safeGet (this, prop, defaultValue);
        },
        toUserTz(target,format){
            let mDate = moment.tz(target, format,serverTz);
            if(mDate.isValid()){
                let result = mDate.clone().tz(this.$timezone).format(format);
                return result;
            }
            return null;
        },
        toServerTz(target,format){
            let mDate = moment.tz(target, format,this.$timezone);
            if(mDate.isValid()){
                let result = mDate.clone().tz(serverTz).format(format);
                return result;
            }
            return null;
        }
    },

    computed: {
        $timezone: {
            cache: false,
            get: function () {
                return safeGet(this.$me,'timezone')||serverTz;
            },
        }
    }

})