import vmTemplatesRoutes from './routes/vmTemplates.routes';
import vmCodesRoutes from './routes/vmCodes.routes';
    

let routes = [...vmTemplatesRoutes,...vmCodesRoutes]
export {
    routes
}