import mongoose from 'mongoose';
import _ from 'underscore';

let crud = ['list','view','create','edit','remove'];
const descriptions = {
    resources: {
        aclRoles: ['all','descriptions', ...crud],
        aclRules: ['all', ...crud],

        users: ['all', ...crud],
        servers: ['all', ...crud],
        aclFilters:['all',...crud],
        observeLogs:['all',...crud],
        tmpFiles:['all',...crud],
        generatorTemplates:['all',...crud],
        generatorItems:['all',...crud],
        vmTemplates:['all','run',...crud],
        vmCodes:['all','run',...crud],
        loggerTags:['all',...crud],
        loggerLogs:['all',...crud],
        loggerGlobalLogs:['all',...crud],
        menuTypes:['all',...crud],
        menuBlocks:['all',...crud],
        menus:['all','menuEditor',...crud],
        menuItems:['all',...crud],
        imageFiles:['all',...crud],
        menuSessions:['list','view','remove'],
        customServices:['all',...crud],
        customServiceInstances:['all',...crud],
        nodes:['all',...crud],
        nodeInstances:['all',...crud],
        settings:['all',...crud],
        customRoutes:[...crud],
        navItems:[...crud],
        kladrStreets:[...crud],
        yaMarketCategories:[...crud],
        foodSourceTypes:[...crud],
        foodSources:[...crud],
        foodCategories:[...crud],
        foodOffers:[...crud],

        npmModules:['all','soap','xml2js','fs'],
        documentation:['view','source']
    },
    actionLabels:{
        all:'Полный доступ',
        descriptions:'Описание',
        list:'Перечисление',
        view:'Просмотр',
        create:'Создание',
        edit:'Изменение',
        remove:'Удаление',
        run:'Запуск произвольного кода',

        menuEditor:'Визуальный редактор меню',
        source:'Просмотр исходного кода'

    }
};

export default descriptions;

setTimeout(()=>{

    _.each(mongoose.modelNames,(modelName)=>{
        if( !descriptions.resources[modelName] ){
            console.warn(`no descriptions for ${modelName}`);
        }
    });

},10000);