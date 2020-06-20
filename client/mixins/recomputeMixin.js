import Vue from 'vue';
let id = 0;
const data = {};

Vue.mixin({

    beforeCreate(){
        if (!this.$options.recomputed)
            return;
        const me = 'r' + id++;
        this._$recomputeId = me;
        Vue.util.defineReactive(data, me, Object.keys(this.$options.recomputed).reduce((r, key) => {
            r[key] = 0
            return r
        }, {}));
        this.$options.computed = this.$options.computed || {};
        Object.keys(this.$options.recomputed).forEach(key => {
            this.$options.computed[key] = vm => {
                data[me][key]
                return this.$options.recomputed[key].call(vm, vm)
            }
        });
    },

    methods:{
        $recompute(key){
            data[this._$recomputeId][key]++
        }
    },


    destroyed () {
        if (this._$recomputeId) {
            delete data[this._$recomputeId]
        }
    }

});