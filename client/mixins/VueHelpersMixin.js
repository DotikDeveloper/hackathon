import Vue from 'vue';
import _ from 'underscore';

Vue.mixin ({
    methods: {
        addCssClass(cssClass){
            let result = {};
            result.addCssClass = _.bind(function(cssClass){
                if(_.isString(cssClass)&&cssClass){
                    this[cssClass] = true;
                }else if(_.isArray(cssClass)){
                    _.each(cssClass,(classItem)=>{
                        this[classItem] = true;
                    })
                }
                else if(_.isObject(cssClass)){
                    Object.assign(this,cssClass);
                }
                return result;
            },result);
            return result.addCssClass(cssClass);
        },

        allowed(model,action){
            if(!model||!model.acl||!model.acl.actions||!action)
                return true;
            if(typeof model.acl.actions[action]==='undefined')
                return true;
            return !!model.acl.actions[action];
        }
    }
});