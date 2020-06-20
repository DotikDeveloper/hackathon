import Vue from "vue";
import $ from 'jquery';
import _ from 'underscore';

Vue.mixin({
   methods:{
       waitElements(selectors){
           return Promise.all(
               _.map(selectors,(selector)=>{
                   let $el = $(this.$el).find(selector);
                   if($el.length>0)
                       return Promise.resolve($el);
                   return new Promise(resolve => {
                       let interval = setInterval(()=>{
                           let $el = $(this.$el).find(selector);
                           if($el.length>0){
                               clearInterval(interval);
                               return resolve($el);
                           }
                       },1);
                   });
               })
           );
       }
   }
});