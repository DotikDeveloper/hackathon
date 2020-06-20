import yaMarketCategoriesRoutes from './routes/yaMarketCategories.routes';
    import foodSourceTypesRoutes from './routes/foodSourceTypes.routes';
import foodSourcesRoutes from './routes/foodSources.routes';
    import foodCategoriesRoutes from './routes/foodCategories.routes';
import foodOffersRoutes from './routes/foodOffers.routes';

let routes = [

	
    	
    	...yaMarketCategoriesRoutes,
...foodSourceTypesRoutes,
...foodSourcesRoutes,
...foodCategoriesRoutes,
...foodOffersRoutes
    

];
export {
    routes
}
