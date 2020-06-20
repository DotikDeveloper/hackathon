import GraphqlPagination from "/client/components/GraphqlPagination";
import gql from 'graphql-tag';
import _ from 'underscore';
import SmartGraphqlForm from "/client/components/SmartGraphqlForm";
import {createDefaultObject} from "/client/vue-form-generator/utils/schema";
import ImageFilesPreview from "../../../files/client/components/ImageFilesPreview";
import {codemirror, userId} from "/client/vue-form-generator/schemaBoilerplates";

const fragment = `
	_id
	name
	menu_type_ids
	user_id
	image_file_id
	vfgSchema
	serverClass
	isSource
	isTarget
	isRoot
	addSystemButtons
user{_id name avatar}
imageFile{_id urls}
menuTypes{
    _id 
    name 
    imageFile{
        _id urls
    } 
}
acl
`;

function vueSchemaFactory () {
    return {
        theme:'bootstrap',
        fields: [
            {
                model: 'name',
                type: 'input', inputType: 'text',
                required: true,
                validator: 'required',
                label: 'Имя'
            },
            {
                model: 'menu_type_ids',
                required: true,
                label: 'Типы меню',
                type:'autocomplete',
                multiple:true,
                placeholder:'Выберите...',
                apollo:{
                    query:gql`
                        query MenuTypesAutocomplete($pagination:PaginationOptions){
                            menuTypes{
                                list(pagination:$pagination){
                                    rows{
                                        name _id
                                    }
                                }
                            }
                        }
                    `,
                    variables (options){
                        let filters = {};
                        if(options.term){
                            filters.name = new RegExp(options.term,'i');
                        }
                        if(options.ids){
                            filters._id = {$in:options.ids};
                        }
                        let page = options.page || 0;
                        let perPage = options.perPage||100;

                        return {
                            pagination:{
                                filters:filters,
                                page:page,
                                perPage:perPage,
                                sort:{
                                    name:1
                                }
                            }
                        }
                    },
                    update(data){
                        return _.chain(data.menuTypes.list.rows)
                        .map((m)=>{
                            return {id:m._id,label:m.name};
                        })
                        .value();
                    }
                },
                validator(value){
                    if(_.isEmpty(value)){
                        return ['Типы меню не могут быть пусты']
                    }
                    return [];
                }
            },
            {
                ...userId(),
                label: 'Создатель'
            }, {
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
                ...codemirror(),
                model: 'vfgSchema',
                required: true, validator: 'required',
                label: 'VFG схема генератора форм'
            },
            {
                model:'addSystemButtons',
                label:'Добавить системные кнопки в форму ввода блока',
                type: 'switch',
                default:true
            },
            {
                ...codemirror(),
                model: 'serverClass',
                required: true, validator: 'required',
                label: 'Класс-обработчик на сервере'
            },
            {
                model: 'isSource',
                type: 'switch',
                label: 'Может быть источником cоединения в визуальном редакторе',
                default:true
            },
            {
                model: 'isTarget',
                type: 'switch',
                label: 'Может быть целью cоединения в визуальном редакторе',
                default:true
            },
            {
                model: 'isRoot',
                type: 'switch',
                label: 'Родительский элемент',
                default:false
            }
        ]
    }
}

const MODULE_NAME = 'menuBlocks';
const MODULE_PATH = `/${MODULE_NAME}`;
export default [
    {
        path: `${MODULE_PATH}/create`,
        name: `${MODULE_NAME}Create`,
        component: SmartGraphqlForm,
        meta: {
            title: 'Создать новый Блоки меню',
            breadcrumbs: {
                label: 'Создать новый',
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'create',
            schema: vueSchemaFactory,
            gqlRoot: 'menuBlocks',
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
                return `Изменить Блоки меню "${this.model.name}"`;
            },
            breadcrumbs: {
                label: async function () {
                    await this.apolloLoaded ();
                    return `Изменить Блоки меню "${this.model.name}"`;
                },
                parent: `${MODULE_NAME}Index`
            }
        },
        props: {
            mode: 'update',
            schema: vueSchemaFactory,
            gqlRoot: 'menuBlocks',
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
            title:'Блоки меню',
            breadcrumbs: {
                label: 'Блоки меню',
                parent: 'home'
            }
        },
        props: {
            header: 'DynamicLink',
            headerParams: {
                to: `${MODULE_PATH}/create`,
                anchor: 'Создать'
            },
            columns: [{
                    label: 'Имя', field: 'name',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {name: `${MODULE_NAME}Update`, params: {_id: row._id}},
                            anchor: row.name,
                            img:row.imageFile?.urls?.small
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
                },

                {
                    label: 'Типы меню', field: 'menuTypes',
                    component: 'DynamicLinks',
                    componentParams: function (row) {
                        return {
                            data: _.map (row.menuTypes, (menuType) => {
                                return {
                                    to: {name: `menuTypesUpdate`, params: {_id: menuType._id}},
                                    anchor: menuType.name,
                                    img:menuType.imageFile?.urls?.small
                                }
                            })
                        }
                    }
                }, {
                    label: 'Создатель', field: 'user',
                    component: 'DynamicLink',
                    componentParams: function (row) {
                        return {
                            to: {name: `usersUpdate`, params: {_id: row.user_id}},
                            anchor: row.user ? row.user.name : '<Неизвестно>',
                            img:row.user?.avatar
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
                },{
                    label:'Действия',
                    field:'acl',
                    components:[
                        {
                            component:'RemoveAction',
                            componentParams(model){
                                return {
                                    gqlRoot:'menuBlocks',
                                    model,
                                    text:`Вы действительно хотите удалить блок "${model.name}" ?`
                                }
                            }
                        }
                    ]
                }
            ],
            query: {
                query: gql`
                    query List($pagination:PaginationOptions!){
                        menuBlocks{
                            list(pagination:$pagination){
                                rows{
                                    ${fragment}
                                },
                                total
                            }
                        }
                    }`,
                update (data) {
                    this.rows = data.menuBlocks.list.rows;
                    this.totalRecords = data.menuBlocks.list.total;
                }
            }
        }
    }
];