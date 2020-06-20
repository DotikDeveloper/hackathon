import _ from 'underscore';
import AclRoles from "/modules/acl2/models/AclRoles";
import Servers from "/modules/cluster/models/Servers";
import HttpClient from "/server/lib/HttpClient";
import descriptions from "../../modules/acl2/apollo/resolvers/descriptions";
import AclRules from "../../modules/acl2/models/AclRules";
import Users from "../../modules/account/Users";
import AclFilters from "../../modules/acl2/models/AclFilters";
import cachedRegExp from "vmrunner/lib/cachedRegExp";
import Calls2MongoReader from "../Calls2MongoReader";
import NavItems from "../../modules/custom/models/NavItems";

const CUSTOMERS_RESOURCES = ['tmpFiles'];

export default function autofill(){
    return _.seqNew([
        function aclRoles(){
            return _.mapAsync({
                admin:'Администратор',
                developer:'Разработчик',
                customer:'Пользователь',//TODO Гость
            },async (label,name)=>{
                /**@type AclRoles*/
                let roleModel = await AclRoles.findOne({name:name});
                if(!roleModel){
                    await new AclRoles({
                        name,label
                    }).save();
                }
            });
        },

        async function userIdFilter(){
            /**@type {AclFilters}*/
            let model = await AclFilters.findOne({name:'user_id'});
            let modelNames = CUSTOMERS_RESOURCES;
            if(!model){
                model = await new AclFilters({
                    modelNames,
                    "mongoPathExpression" : "'user_id';",
                    "mongoValueExpression" : "this.model.user_id;",
                    "labelExpression" : "'user_id'; ",
                    "name" : "user_id",
                    "fieldType" : "string"
                }).save();
            }else{
                if(!_.isEmpty(_.difference(modelNames,model.modelNames))){
                    model.modelNames = _.union(model.modelNames,modelNames);
                    await model.save();
                }
            }
            return model;
        },

        async function users(){
            if(process.env.AUTOFILL!=='development')
                return;
            let roles = await AclRoles.find();
            return _.mapAsync(roles,async (role)=>{
                let user = await Users.findOne({login:`${role.name}`});
                if(user)
                    return;
                user = new Users ({
                    login:`${role.name}`,
                    type:Users.types.password.key,
                    name:role.name.charAt(0).toUpperCase() + role.name.slice(1),
                    password:`user`,
                    email:`${role.name}@proxy.loc`,
                    roleName:role.name
                });
                await user.save();
            });
        },

        async function aclRules(){
            if(process.env.AUTOFILL!=='development')
                return;
            const rulesData = {
                allow_all:{
                    developer:[/.*/gi],
                    admin:[/.*/gi]
                },
                disallow_all:{

                },
                allow_rules:{

                }
            };
            const allResources = _.keys(descriptions.resources);

            _.each(rulesData,(rolesRulesData,mode)=>{
                _.each(rolesRulesData,async (definedResourceNames,roleName)=>{
                    let selectedResourceNames = _.chain(definedResourceNames)
                    .map((resName)=>{
                        if(_.isString(resName))
                            return resName;
                        if(_.isRegExp(resName)){
                            let filtered = _.filter(allResources,(tmpResName)=>{
                                let result = cachedRegExp(resName).test(tmpResName);
                                return result;
                            });
                            return filtered;
                        }
                    })
                    .compact()
                    .flatten()
                    .value();
                    if(!_.isEmpty(selectedResourceNames)){
                        let unfindedResourceNames = await _.mapAsync(selectedResourceNames,async (tmpResName)=>{
                            let rule = await AclRules.findOne({
                                roles:{$in:[roleName]},
                                resources:{$in:[tmpResName]},
                                mode:mode
                            });
                            return rule?null:tmpResName;
                        });
                        let assocResourceNames = _.chain(unfindedResourceNames)
                        .compact()
                        .groupBy((resName)=>{
                            let actions = descriptions.resources[resName];
                            return actions.join(',');
                        })
                        .values()
                        .value();

                        if(!_.isEmpty(assocResourceNames)){
                            _.each(assocResourceNames,(resNames)=>{
                                new AclRules({
                                    roles:[roleName],
                                    resources:resNames,
                                    mode:mode,
                                    actions:descriptions.resources[_.first(resNames)]
                                }).save();
                            });
                        }
                    }
                });
            });
        },

        async function customeRules(h){
            let rules = await AclRules.find({
                "roles" : {$in:["customer"]},
                resources:{$in:CUSTOMERS_RESOURCES}
            });
            let filledResources = _.chain(rules)
            .pluck('resources')
            .flatten()
            .value();
            let unfilledResources = _.difference(CUSTOMERS_RESOURCES,filledResources);
            if(!_.isEmpty(unfilledResources)){
                await new AclRules({
                    "roles" : ["customer"],
                    "resources" : unfilledResources,
                    "actions" : [
                        "all",
                        "list",
                        "view",
                        "create",
                        "edit",
                        "remove"
                    ],
                    "rules" : {
                        "condition" : "AND",
                        "rules" : [
                            {
                                "id" : h.userIdFilter._id,
                                "field" : "user_id",
                                "type" : "string",
                                "operator" : "equal",
                                "value" : "[{\"mode\":\"variable\",\"values\":[\"user._id\"]}]"
                            }
                        ],
                        "valid" : true
                    },
                    "mode" : "allow_rules"
                }).save()
            }
        },

        async function navItems() {
            let user = await Users.findOne({roleName:'developer'});
            if(!user)
                return;
            let data = [{
                "_id" : "5ed68d29b0bb725e31592538",
                "user_id" : user._id,
                "name" : "Аккаунт",
                "dataExpression" : "{\n  text: 'Аккаунт',\n  data: {\n    isRoot: true,\n    to: {\n      name: 'account'\n    },\n  },\n  children: []\n};",
                "__v" : 0,
                "index" : 1,
                "parent_item_id" : null,
                "rules" : {
                    "condition" : "AND",
                    "rules" : [
                        {
                            "id" : "user.id",
                            "field" : "user.id",
                            "type" : "string",
                            "operator" : "is_not_null",
                            "value" : null
                        }
                    ],
                    "valid" : true
                }
            },{
                "_id" : "5ed781925d1e240e659d3c33",
                "rules" : {
                    "condition" : "OR",
                    "rules" : [
                        {
                            "id" : "user.roleName",
                            "field" : "user.roleName",
                            "type" : "string",
                            "operator" : "equal",
                            "value" : "[{\"mode\":\"value\",\"values\":[\"admin\"]}]"
                        },
                        {
                            "id" : "user.roleName",
                            "field" : "user.roleName",
                            "type" : "string",
                            "operator" : "equal",
                            "value" : "[{\"mode\":\"value\",\"values\":[\"developer\"]}]"
                        }
                    ],
                    "valid" : true
                },
                "user_id" : user._id,
                "name" : "Роли",
                "dataExpression" : "{\n  text: 'Роли',\n  data: {\n    isRoot: true,\n    to: {\n      name: 'aclRolesIndex'\n    },\n  },\n  children: [{\n    text: 'Acl2',\n    data: {\n      isRoot: false,\n      to: {\n        name: 'aclRulesIndex'\n      }\n    },\n  }, {\n    text: 'Acl2 фильтры',\n    data: {\n      isRoot: false,\n      to: {\n        name: 'aclFiltersIndex'\n      }\n    },\n  }]\n}",
                "index" : 2,
                "__v" : 0,
                "parent_item_id" : null
            },{
                "_id" : "5ed7822b5d1e240e659d3c70",
                "rules" : {
                    "condition" : "OR",
                    "rules" : [
                        {
                            "id" : "user.roleName",
                            "field" : "user.roleName",
                            "type" : "string",
                            "operator" : "in",
                            "value" : "[{\"mode\":\"expression\",\"values\":[\"['admin','developer']\"]}]"
                        }
                    ],
                    "valid" : true
                },
                "user_id" : user._id,
                "dataExpression" : "{\n  text: 'Пользователи',\n  data: {\n    isRoot: true,\n    to: {\n      name: 'usersIndex'\n    },\n  },\n  children: [{\n    text: 'Создать',\n    data: {\n      isRoot: false,\n      to: {\n        name: 'usersCreate'\n      },\n      disabled: false\n    },\n  }, {\n    text: 'Тарифы пользователей',\n    data: {\n      isRoot: false,\n      to: {\n        name: 'userTarifsIndex'\n      },\n      disabled: false\n    },\n  }]\n}",
                "name" : "Пользователи",
                "index" : 3,
                "__v" : 0,
                "parent_item_id" : null
            },{
                "index" : 0,
                "rules" : {
                    "condition" : "AND",
                    "rules" : [
                        {
                            "id" : "user.id",
                            "field" : "user.id",
                            "type" : "string",
                            "operator" : "is_null",
                            "value" : null
                        }
                    ],
                    "valid" : true
                },
                "user_id" : user._id,
                "dataExpression" : "{\n  text: 'Вход',\n  data: {\n    isRoot: true,\n    to: {\n      name: 'login'\n    },\n  },\n  children: []\n}",
                "name" : "Вход",
                "__v" : 0,
                "parent_item_id" : null
            },{
                "_id" : "5ed78a1d7b94681635b2ec73",
                "index" : 7,
                "rules" : {
                    "condition" : "AND",
                    "rules" : [
                        {
                            "id" : "user.roleName",
                            "field" : "user.roleName",
                            "type" : "string",
                            "operator" : "equal",
                            "value" : "[{\"mode\":\"value\",\"values\":[\"developer\"]}]"
                        }
                    ],
                    "valid" : true
                },
                "user_id" : user._id,
                "name" : "Dev",
                "dataExpression" : "{\n  text: 'Dev',\n  data: {\n    isRoot: true\n  },\n  children: [{\n    text: 'Генератор',\n    data: {\n      isRoot: true,\n    },\n    children: [{\n      text: 'Шаблоны',\n      data: {\n        isRoot: false,\n        to: {\n          name: 'generatorTemplatesIndex'\n        }\n      }\n    }, {\n      text: 'Заполненные шаблоны',\n      data: {\n        isRoot: false,\n        to: {\n          name: 'generatorItemsIndex'\n        }\n      }\n    }]\n  }, {\n    text: 'vmRunner',\n    data: {\n      isRoot: true\n    },\n    children: [{\n      text: 'vmTemplates',\n      data: {\n        isRoot: false,\n        to: {\n          name: 'vmTemplatesIndex'\n        }\n      }\n    }, {\n      text: 'vmCodes',\n      data: {\n        isRoot: false,\n        to: {\n          name: 'vmCodesIndex'\n        }\n      }\n    }]\n  }, {\n    text: 'Логи',\n    data: {\n      isRoot: true\n    },\n    children: [{\n      text: 'Локальные логи',\n      data: {\n        isRoot: false,\n        to: {\n          name: 'loggerLogsIndex'\n        }\n      }\n    }, {\n      text: 'Глобальные логи',\n      data: {\n        isRoot: false,\n        to: {\n          name: 'loggerGlobalLogsIndex'\n        }\n      }\n    }, {\n      text: 'Настройки тэгов',\n      data: {\n        isRoot: false,\n        to: {\n          name: 'loggerTagsIndex'\n        }\n      }\n    }]\n  }, {\n    text: 'PhraseFiles',\n    data: {\n      isRoot: false,\n      to: {\n        name: 'phraseFilesIndex'\n      }\n    }\n\n  }, {\n    text: 'Кластер',\n    data: {\n      isRoot: true,\n    },\n    children: [{\n      text: 'Серверы',\n      data: {\n        isRoot: false,\n        to: {\n          name: 'serversIndex'\n        }\n      }\n    }, {\n      text: 'Ноды',\n      data: {\n        isRoot: false,\n        to: {\n          name: 'nodesIndex'\n        }\n      }\n    }, {\n      text: 'Инстансы',\n      data: {\n        isRoot: false,\n        to: {\n          name: 'nodeInstancesIndex'\n        }\n      }\n    }]\n  }, {\n    text: 'Сервисы',\n    data: {\n      isRoot: true,\n      to: {\n        name: 'customServicesIndex'\n      }\n    },\n    children: [{\n      text: 'Инстансы',\n      data: {\n        isRoot: false,\n        to: {\n          name: 'customServiceInstancesIndex'\n        }\n      }\n    }]\n  }, {\n    text: 'Настройки',\n    data: {\n      isRoot: false,\n      to: {\n        name: 'settingsIndex'\n      }\n    },\n  }, {\n    text: 'Кастомизация',\n    data: {\n      isRoot: true\n    },\n    children: [{\n      text: 'Роуты',\n      data: {\n        to: {\n          name: 'customRoutesIndex'\n        }\n      }\n    }, {\n      text: 'Элементы навигации',\n      data: {\n        to: {\n          name: 'navItemsIndex'\n        }\n      }\n    }]\n  }]\n}",
                "__v" : 0,
                "parent_item_id" : null
            },{
                "_id" : "5ed78f8d7b94681635b2ece9",
                "index" : 9,
                "rules" : {
                    "condition" : "AND",
                    "rules" : [
                        {
                            "id" : "user.id",
                            "field" : "user.id",
                            "type" : "string",
                            "operator" : "is_not_null",
                            "value" : null
                        }
                    ],
                    "valid" : true
                },
                "user_id" : user._id,
                "name" : "Меню",
                "dataExpression" : "(async () => {\n  let targetUser = this.user;\n  if (this.user.currentUserId) {\n    let tmpUser = await Users.findOne({\n      _id: this.user.currentUserId\n    });\n    if(tmpUser){\n      targetUser = tmpUser;\n    }\n  }\n  \n  let menus = await Menus.find({user_id:targetUser._id});\n  \n  let result = {\n    text: `Меню ( ${_.size(menus)} )`,\n    data: {\n      isRoot: true,\n      to: {\n        name: 'menusIndex'\n      }\n    }\n  }\n\n  if (['admin', 'developer'].indexOf(this.user.roleName) > -1) {\n    result.children = [{\n      text: 'Типы меню',\n      data: {\n        isRoot: false,\n        to: {\n          name: 'menuTypesIndex'\n        }\n      }\n    }, {\n      text: 'Блоки меню',\n      data: {\n        isRoot: false,\n        to: {\n          name: 'menuBlocksIndex'\n        }\n      }\n    }, {\n      text: 'Сессии меню',\n      data: {\n        isRoot: false,\n        to: {\n          name: 'menuSessionsIndex'\n        }\n      }\n    }]\n  }\n  return result;\n})();",
                "__v" : 0,
                "parent_item_id" : null
            }];
            data = _.sortBy(data,'index');
            await _.mapAsync(data,async (rawNavItem)=>{
                let navItem = await NavItems.findOne({name:rawNavItem.name});
                if(!navItem){
                    await new NavItems(rawNavItem).save();
                }
            });
        }
    ])
}

function beforePreload(){
    return _.seqNew([
        // eslint-disable-next-line no-unused-vars
        async function servers(h,cb){
            if(process.env.AUTOFILL!=='development'||!process.env.SERVER_NAME)
                return;
            let server = await Servers.findOne({name:process.env.SERVER_NAME});
            if(!server){
                let masterServer = await Servers.findOne({isMaster:true});
                let defaultServer = await Servers.findOne({isDefault:true});
                const adminBaseUrl = process.env.BASE_URL||'http://localhost:4000/';
                let urlData = HttpClient.urlParser.parse(adminBaseUrl);
                delete urlData.host;
                delete urlData.href;
                urlData.port++;
                const serviceNodeBaseUrl = HttpClient.urlParser.format(urlData);
                urlData.port++;
                const userNodeBaseUrl = HttpClient.urlParser.format(urlData);

                await new Servers({
                    name:process.env.SERVER_NAME,
                    isMaster:!masterServer,
                    isDefault:!defaultServer,
                }).save();
            }
        }
    ])
}

export {beforePreload}