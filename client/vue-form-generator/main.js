import component from "./formGenerator.vue";
import * as schema  from "./utils/schema.js";
import validators from "./utils/validators.js";
import fieldComponents from "./utils/fieldsLoader";
import abstractField  from "./fields/abstractField";
import Vue from 'vue';

const install = (Vue, options) => {
    Vue.mixin({
        computed: {
            $parentModel: {
                cache: false,
                get() {
                    function getChildVfg(comp){
                        if(!comp)
                            return null;
                        if (comp.$options && comp.$options.name == 'formGenerator') {
                            return comp;
                        }
                        if(comp.vfg)
                            return comp.vfg;
                        if(!comp.$parent)
                            return null;
                        return getChildVfg(comp.$parent);
                    }
                    function getParentModel (obj) {
                        if (!obj)
                            return null;
                        if (obj.$options && obj.$options.name == 'formGenerator') {
                            return obj.model;
                        }
                        return getParentModel (obj.$parent);
                    }
                    let vfg = getChildVfg(this);
                    if(!vfg)
                        return null;
                    return getParentModel(vfg.$parent);
                }
            },
        }
    });

	Vue.component("VueFormGenerator", module.exports.component);
	if (options && options.validators) {
		for (let key in options.validators) {
			if ({}.hasOwnProperty.call(options.validators, key)) {
				validators[key] = options.validators[key];
			}
		}
	}
};

export {
	component,
	schema,
	validators,
	abstractField,
	fieldComponents,
	install
};

import UploadFile from "./vue-file-upload/UploadFile";
Vue.component('fieldUploadFile',UploadFile);

//import ExpressionsList from "./tabs/ExpressionsList";
//Vue.component("fieldExpressionsList", ExpressionsList);

import QueryBuilder from "./querybuilder/QueryBuilder";
Vue.component("fieldQueryBuilder", QueryBuilder);

Vue.component('fieldCodemirror', async function (resolve, reject) {
    console.log('FieldCodemirror load start');
    let FieldCodemirror = (await import(/* webpackChunkName: "FieldCodemirror" */ "./codemirror/FieldCodemirror" )).default;
    console.log('FieldCodemirror load end');
    resolve(FieldCodemirror);
});

import Autocomplete from "./autocomplete/Autocomplete";
Vue.component('fieldAutocomplete',Autocomplete);