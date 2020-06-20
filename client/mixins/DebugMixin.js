import Vue from 'vue';
import {uniqueId} from 'lodash';
Vue.mixin({
    computed: {
        $Props() {
            return this.$props;
        },
        propsData(){
            return this.$options.propsData;
        },
        $Apollo(){
            return this.$apollo;
        },
        $componentID(){
            if(!this.$_componentID){
                // eslint-disable-next-line vue/no-side-effects-in-computed-properties
                this.$_componentID = uniqueId();
            }
            return this.$_componentID;
        }
    }

})