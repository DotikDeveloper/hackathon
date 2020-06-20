import menuTypesRoutes from './routes/menuTypes.routes';
import menuBlocksRoutes from './routes/menuBlocks.routes';
import menusRoutes from './routes/menus.routes';
import menuItemsRoutes from './routes/menuItems.routes';
import menuSessionsRoutes from './routes/menuSessions.routes';

let routes = [
    ...menuTypesRoutes,
    ...menuBlocksRoutes,
    ...menusRoutes,
    ...menuItemsRoutes,
    ...menuSessionsRoutes
];
export {
    routes
}
