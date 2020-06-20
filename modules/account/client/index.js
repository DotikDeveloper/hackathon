import './mixin';
import Vue from 'vue';
import UsersActions from "./components/UsersActions";
Vue.component('UsersActions',UsersActions);

import usersRoutes from './routes/users';
import cabinetRoutes from "./routes/cabinet";

const routes = [
    ...usersRoutes,
    ...cabinetRoutes
];

export {
    routes
}

