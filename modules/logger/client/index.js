import loggerTagsRoutes from './routes/loggerTags.routes';
import loggerLogsRoutes from './routes/loggerLogs.routes';
import loggerGlobalLogsRoutes from './routes/loggerGlobalLogs.routes';
let routes = [
    ...loggerTagsRoutes,
    ...loggerLogsRoutes,
    ...loggerGlobalLogsRoutes
];
export {
    routes
}