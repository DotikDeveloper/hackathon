import customServicesRoutes from './routes/customServices.routes';
import customServiceInstancesRoutes from './routes/customServiceInstances.routes';

let routes = [
    ...customServicesRoutes,
    ...customServiceInstancesRoutes
];
export {
    routes
}
