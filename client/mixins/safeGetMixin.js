import Vue from 'vue';
import {get as safeGet} from 'lodash';
Vue.mixin({

    methods: {
        safeGet (prop, defaultValue) {
            return safeGet (this, prop, defaultValue);
        }
    }

});