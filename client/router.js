import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Register from "./components/Register";
import PageNotFound from './components/PageNotFound';
import Test from './components/Test';
import _ from 'underscore';
import Documentation from './Documentation';

Vue.use (Router);

import {routes as accountRoutes} from '/modules/account/client/index';
import {routes as clusterRoutes} from '/modules/cluster/client';
import {routes as acl2Routes} from '/modules/acl2/client/index';
import {routes as generatorRoutes} from '/modules/generator/client/index'
import devRoutes from "./dev/routes";
import {routes as vmRunnerRoutes} from '/modules/vmrunner/client/index';
import {routes as loggerRoutes} from '/modules/logger/client/index';
import {routes as menuRoutes} from '/modules/menu/client/index';
import {routes as servicesRoutes} from '/modules/services/client/index';
import {routes as settingsRoutes} from '/modules/settings/client/index';
import {routes as customRoutes} from '/modules/custom/client/index';
import {routes as geoRoutes} from '/modules/geo/client/index';
import {routes as foodRoutes} from '/modules/food/client/index';

const routerInstance = new Router ({
    mode: 'history',
    base: process.env.BASE_URL,
    routes: [
        {
            path: '/',
            name: 'home',
            component: Home,
            meta: {
                breadcrumbs: {
                    label: 'Главная'
                }
            },
        },

        {
            path: '/register',
            name: 'register',
            component: Register
        }, {
            path: '/test',
            name: 'test',
            component: Test
        }, {
            name: 'documentation',
            meta: {
                title: 'Документация',
                parent: 'home',
                breadcrumbs: {
                    label: 'Документация'
                }
            },
            path: "/documentation", component: Documentation
        }, {
            path: "*", component: PageNotFound
        }
    ]
});

_.each ([
    accountRoutes, clusterRoutes
    ,devRoutes
    , acl2Routes, generatorRoutes
    , vmRunnerRoutes
    , loggerRoutes
    , menuRoutes
    , servicesRoutes
    , settingsRoutes
    , customRoutes
    , geoRoutes
    ,foodRoutes
], (routes) => {
    routerInstance.addRoutes (routes);
});

export default routerInstance;
