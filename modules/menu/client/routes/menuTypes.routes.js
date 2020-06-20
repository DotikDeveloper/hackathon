import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import _ from 'underscore';
import SmartGraphqlForm from "/client/components/SmartGraphqlForm";
import {createDefaultObject} from "/client/vue-form-generator/utils/schema";
import ImageFilesPreview from "/modules/files/client/components/ImageFilesPreview";
import {codemirror, userId} from "/client/vue-form-generator/schemaBoilerplates";
import {MenuSuperTypes} from "../../enums";

const fragment = `
	_id
	name
	image_file_id
	user_id
	ctxClassExpr
	supertype
    user{_id name}
    imageFile{_id urls }
    menuBlocks{
        _id name imageFile{urls}
    }
    menuVfgSchema
    acl
`;

function vueSchemaFactory () {
    return {
        fields: [
            {
                model: 'supertype',
                type: 'select',
                required: true, validator: 'required',
                label: 'Тип',
                values:MenuSuperTypes.toSelect(),
            },
            {
                model: 'name',
                type: 'input', inputType: 'text',
                required: true, validator: 'required',
                label: 'Имя'
            },
            {
                model: 'image_file_id',
                label: 'Иконка',
                type:'uploadFile',
                itemComponent:ImageFilesPreview,
                multiple:false,
                apollo:{
                    query:{
                        query:gql`
                            query ImageFilesView($_id:String!){
                                imageFiles{
                                    view(_id:$_id){
                                        _id
                                        user_id
                                        expires
                                        versions{
                                            original{
                                                name
                                            }
                                        }
                                        url
                                        urls
                                        fileName
                                    }
                                }
                            }
                        `,
                        variables(id){
                            if (!_.isEmpty(id)) {
                                return {
                                    _id:id
                                }
                            }
                        },
                        update(data){
                            if(data&&data.imageFiles&&data.imageFiles.view){
                                return this.items = [data.imageFiles.view];
                            }else
                                this.items = [];
                        }
                    },
                    mutation:{
                        mutation:gql`
                            mutation CreateImageFile($model:JSONObject,$file:Upload){
                                imageFiles{
                                    create(model:$model,file:$file){
                                        _id success message errors model
                                    }
                                }
                            }
                        `,
                        variables(file){
                            return {
                                file:file,
                                model:{}
                            }
                        },
                        update(data){
                            return data.data.imageFiles.create._id;
                        }
                    }
                }
            },
            {
                ...userId(),
                label: 'Создатель'
            },
            {
                ...codemirror(),
                model: 'ctxClassExpr',
                label: 'Класс контекста меню'
            },{
                ...codemirror(),
                model:'menuVfgSchema',
                label:'VFG cхема дополнительных полей меню'
            }
        ]
    }
}

const MODULE_NAME = 'menuTypes';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: SmartGraphqlForm,
        meta: {
            title: 'Создать новый Типы меню',
            breadcrumbs: {
                label: 'Создать новый',
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'create',
            schema: vueSchemaFactory,
            gqlRoot: 'menuTypes',
            fragment: fragment,
            events: {
                submit () {
                    this.$router.push ({name: `${MODULE_NAME}Index`});
                },
                cancel () {
                    this.$router.push ({name: `${MODULE_NAME}Index`});
                }
            },
            initModel () {
                return createDefaultObject.apply (this, [this.computedSchema, {}]);
            }
        }
    }, {
        path: `${MODULE_PATH}/update/:_id`,
        name: `${MODULE_NAME}Update`,
        component: SmartGraphqlForm,
        meta: {
            title: async function () {
                await this.apolloLoaded ();
                return `Изменить Типы меню "${this.model.name}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Изменить Типы меню "${this.model.name}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'update',
            schema: vueSchemaFactory,
            gqlRoot: 'menuTypes',
            fragment: fragment,
            events: {
                submit () {
                    this.$router.push ({name: `${MODULE_NAME}Index`});
                },
                cancel () {
                    this.$router.push ({name: `${MODULE_NAME}Index`});
                }
            }
        }
    }, {
        path: `${MODULE_PATH}`,
        name: `${MODULE_NAME}Index`,
        component: GraphqlPagination,
        meta: {
            title:'Типы меню',
            breadcrumbs: {
                label: 'Типы меню',
                parent: 'home'
            }
        },
        props: {
            header: 'DynamicLink',
            headerParams: {
                to: `${MODULE_PATH}/create`,
                anchor: 'Создать'
            },
            columns: [
                {
                    label: 'Имя', field: 'name',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {name: `${MODULE_NAME}Update`, params: {_id: row._id}},
                            img:row.imageFile?.urls?.small,
                            anchor: row.name
                        }
                    },
                    filterOptions: {
                        enabled: true, // enable filter for this column
                        placeholder: 'Поиск..', // placeholder for filter input
                        filterValue: undefined, // initial populated value for this filter
                        trigger: 'enter', //only trigger on enter not on keyup
                        transform ($input) {
                            return String ($input).length > 0 ? new RegExp ($input, 'i') : undefined;
                        }
                    }
                }, {
                    label: 'Создатель', field: 'user_id',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {name: `usersUpdate`, params: {_id: row.user_id}},
                            anchor: row.user ? row.user.name : '<Не определено>'
                        }
                    }
                },{
                    label: 'Доступные блоки', field: 'menuBlocks',
                    component: 'DynamicLinks',
                    componentParams: function (row) {
                        return {
                            data: _.map (row.menuBlocks, (menuBlock) => {
                                return {
                                    to: {name: `menuBlocksUpdate`, params: {_id: menuBlock._id}},
                                    anchor: menuBlock.name,
                                    img:menuBlock.imageFile?.urls?.small
                                }
                            })
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
                                    gqlRoot:'menuTypes',
                                    model,
                                    text:`Вы действительно хотите удалить тип меню "${model.name}" ?`
                                }
                            }
                        }
                    ]
                }


            ],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        menuTypes{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.menuTypes.list.rows;
                    this.totalRecords = data.menuTypes.list.total;
                }
            }
        }
    }
];