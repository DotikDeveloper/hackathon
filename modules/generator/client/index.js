import generatorTemplatesRoutes from './routes/generatorTemplates.routes';
import generatorItemsRoutes from './routes/generatorItems.routes';
let routes = [
    ...generatorTemplatesRoutes,
    ...generatorItemsRoutes
];
export {
    routes
}