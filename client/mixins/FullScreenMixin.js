import Vue from 'vue';
import _ from 'underscore';
import $ from 'jquery';

const selectors = [
    '#nav','#breadcrumbs','#flash-messages','#left-nav'
];
Vue.mixin({
   created() {

   },

   computed:{
       $fullScreen:{
           cache: false,
           get: function () {
               return this.$store.getters.fullScreen;
           },
       }
   },

   methods:{
       enableFullScreen(){
           _.each(selectors,(selector)=>{
              $(selector).hide(1000);
           });
           this.$store.commit('setFullScreen',true);
       },
       disableFullScreen(){
           _.each(selectors,(selector)=>{
               $(selector).show(1000);
           });
           this.$store.commit('setFullScreen',false);
       }
   }


});