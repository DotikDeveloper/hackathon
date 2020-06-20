import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import {formatRuDateTime} from "../../../../lib/utils";
import EJSON from 'ejson';

const MODULE_NAME = 'menuSessions';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [{
    path: `${MODULE_PATH}`,
    name: `${MODULE_NAME}Index`,
    component: GraphqlPagination,
    meta: {
        title:'Сохраненные данные диалогов меню',
        breadcrumbs: {
            label: 'Сохраненные данные диалогов меню',
            parent: 'home'
        }
    },
    props: {
        columns: [
            {
                label: 'Мета инфо', field: 'meta',
                component: 'VueJsonPretty',
                componentParams: function (row) {
                    return {
                        data: row.meta
                    }
                }
            },{
                label: 'Меню', field: 'menu',
                component: 'DynamicLink',
                componentParams: function (row) {
                    return {
                        to: {
                            name: `menusUpdate`,
                            params: {_id: row.menu_id}
                        },
                        anchor: row.menu?.name,
                        img: row.menu?.menuType?.imageFile?.urls?.small
                    }
                }
            },{
                label: 'Пользователь', field: 'user',
                component: 'DynamicLink',
                componentParams: function (row) {
                    return {
                        to: {
                            name: `usersUpdate`,
                            params: {_id: row.user_id}
                        },
                        anchor: row.user?.name||'<Неизвестно>',
                        img: row.user?.avatar
                    }
                }
            },{
                label: 'Время создания', field: 'created',
                filterOptions: {
                    enabled: true, // enable filter for this column
                    placeholder: 'Поиск..', // placeholder for filter input
                    filterValue: undefined, // initial populated value for this filter
                    trigger: 'enter', //only trigger on enter not on keyup
                    transform ($input) {
                        return String ($input).length > 0 ? new RegExp ($input, 'i') : undefined;
                    }
                },
                formatFn: formatRuDateTime
            },

            {
                label: 'Данные', field: 'serialized',
                component: 'VueJsonPretty',
                componentParams: function (row) {
                    try {
                        return {
                            data: EJSON.parse(row.serialized)
                        }
                    } catch (e) {
                        return {
                            data: row.serialized
                        }
                    }
                }
            },{
                label:'Действия',
                field:'acl',
                components:[
                    {
                        component:'RemoveAction',
                        componentParams(model){
                            return {
                                gqlRoot:'menuSessions',
                                model,
                                text:`Вы действительно хотите сессию "${model._id}" ?`
                            }
                        }
                    }
                ]
            }


        ],
        query: {
            query: gql`
                query List($pagination:PaginationOptions!){
                    menuSessions{
                        list(pagination:$pagination){
                            rows{
                                _id
                                meta
                                menu_id
                                created
                                user_id
                                serialized
                                user{
                                    _id 
                                    name
                                    avatar
                                }
                                menu{
                                    _id
                                    name
                                    menuType{
                                        imageFile{
                                            urls
                                        }
                                    }
                                }
                            },
                            total
                        }
                    }
                }`,
            update (data) {
                this.rows = data.menuSessions.list.rows;
                this.totalRecords = data.menuSessions.list.total;
            }
        }
    }
}
];