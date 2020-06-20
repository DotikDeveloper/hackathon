import customRoutesRoutes from './routes/customRoutes.routes';
import navItemsRoutes from './routes/navItems.routes';
// eslint-disable-next-line no-undef
window.__webpack_require__ = __webpack_require__;

let routes = [
    ...customRoutesRoutes,
    ...navItemsRoutes
];
export {
    routes
}