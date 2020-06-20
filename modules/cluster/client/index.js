import nodesRoutes from './routes/nodes.routes';
import serversRoutes from "./routes/servers.routes";
import nodeInstancesRoutes from './routes/nodeInstances.routes';

let routes = [
    ...serversRoutes,
    ...nodesRoutes,
    ...nodeInstancesRoutes
];
export {
    routes
}
