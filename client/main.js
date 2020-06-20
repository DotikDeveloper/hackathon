import 'jquery';
require("jquery-ui/ui/widgets/draggable");
require('/lib/underscore.mixins');
import moment from 'moment';
moment.locale('ru');
import './style.sass';
import apolloProvider from "./apollo/apolloProvider";
import Vue from 'vue'
import store from './vuex';
import './dev';
import '/client/mixins';
import VueSplit from 'vue-split-panel'
import _ from 'underscore';

Vue.use(VueSplit);

import BootstrapVue from 'bootstrap-vue'
    import 'bootstrap/dist/css/bootstrap.css'
    import 'bootstrap-vue/dist/bootstrap-vue.css'
Vue.use(BootstrapVue);

import datePicker from 'vue-bootstrap-datetimepicker';
import 'pc-bootstrap4-datetimepicker/build/css/bootstrap-datetimepicker.css';
Vue.use(datePicker);

import App from '/client/App.vue'

import router from '/client/router'

import * as VueFormGenerator from "/client/vue-form-generator/main";
Vue.use(VueFormGenerator);

import VfgFieldObject from '/client/vue-form-generator/vfg-field-object/src/index';
Vue.use(VfgFieldObject);

import VfgFieldArray from '/client/vue-form-generator/vfg-field-array/index';
Vue.use(VfgFieldArray);

 import VBreadcrumbs from "./components/VBreadcrumbs/VBreadcrumbs";
Vue.component('v-breadcrumbs',VBreadcrumbs);
import BreadCrumb from "./components/BreadCrumb";
 Vue.component('BreadCrumb',BreadCrumb);

import DynamicLink from "./components/DynamicLink";
Vue.component('DynamicLink',DynamicLink);

import DynamicLinks from "./components/DynamicLinks";
Vue.component('DynamicLinks',DynamicLinks);

import DynamicButton from "./components/DynamicButton";
Vue.component('DynamicButton',DynamicButton);

import VueLoading from 'vue-loading-template'
Vue.use(VueLoading,{
    type:'spiningDubbles',
    color:"#007bff",
    size:{
        width:'100px', height: '100px'
    }
});

import VueFormWizard from 'vue-form-wizard'
import 'vue-form-wizard/dist/vue-form-wizard.min.css'
Vue.use(VueFormWizard);

import LogRocket from 'logrocket';
LogRocket.init('tc1gkc/test');

LogRocket.getSessionURL(sessionURL => {
    console.log(sessionURL);
});
//"vue-good-table": "^2.18.1",
import VueGoodTablePlugin from 'vue-good-table/dist/vue-good-table.min.js';
import 'vue-good-table/dist/vue-good-table.css'
Vue.use(VueGoodTablePlugin);


import '/modules/account/client/';



import VueFlashMessage from 'vue-flash-message';
Vue.use(VueFlashMessage);
import 'vue-flash-message/dist/vue-flash-message.min.css';

import VModal from 'vue-js-modal';
Vue.use(VModal, { dialog: true });
import ConfirmDialog from "./components/ConfirmDialog";
Vue.component('ConfirmDialog',ConfirmDialog);

Vue.config.productionTip = false;

import LiquorTree from 'liquor-tree'
Vue.use(LiquorTree);

import VueJsonPretty from 'vue-json-pretty'
Vue.component('VueJsonPretty',VueJsonPretty);

let navTree = import(/* webpackIgnore: true */'/navTree.js');

import RemoveAction from "./components/RemoveAction";
Vue.component('RemoveAction',RemoveAction);

import YmapPlugin from 'vue-yandex-maps'

Vue.use(YmapPlugin, {
    apiKey: 'e7ef6736-b3b8-4398-82a8-c75780710391',
    lang: 'ru_RU',
    coordorder: 'latlong',
    version: '2.1'
})

import(/* webpackIgnore: true */'./customRoutes.js').then(async (customRoutesModule)=>{
    let treeData = (await navTree).default;
    if(!_.isEmpty(customRoutesModule.default)){
        router.addRoutes (customRoutesModule.default);
    }
    new Vue({
        data:{
            treeData
        },
        router,
        apolloProvider,
        store,
        render: h => h(App)
    }).$mount('#app');
});



