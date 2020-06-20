import aclFiltersRoutes from './routes/aclFilters.routes';
import aclRulesRoutes from './routes/aclRules.routes';
import aclRolesRoutes from './routes/aclRoles.routes';
let routes = [
    ...aclFiltersRoutes,
    ...aclRulesRoutes,
    ...aclRolesRoutes
];
export {
    routes
}