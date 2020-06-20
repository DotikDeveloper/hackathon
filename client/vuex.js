import Vue from 'vue';
import Vuex from 'vuex'

Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        me:null,
        fullScreen:false,
    },
    getters: {
        me: state => {
            return state.me;
        },
        fullScreen:state => {
            return state.fullScreen;
        },
    },
    mutations: {
        setMe (state,me) {
            state.me = me;
            console.log('me changed');
            window.app.$emit('navTreeChanged');
        },
        setFullScreen (state,fullScreen) {
            state.fullScreen = fullScreen;
        }
    }
});

export default store;

