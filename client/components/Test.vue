<template>
    <vue-form-generator :schema="schema" :model="model" :options="schema.formOptions" path=""
    ></vue-form-generator>
</template>
<script>
    import gql from 'graphql-tag';
    import _ from 'underscore';

    const schema = {
        fields:[
            {
                model:'source',
                type:'select',
                values:[
                    {id:'FILE',name:'Звуковой файл'},
                    {id:'EXPRESSION',name:'Динамическое выражение'},
                    {id:'FIELD',name:'Поле'},
                    {id:'PROJECT_VAR',name:'Поле проекта'},
                    {id:'VALUE',name:'Значение'}
                ]
            },{
                model:'file_id',
                type:'uploadFile',
                label:'Файл',
                apollo:{
                    mutation:{

                    }
                }
            },{
                model:'autocompleteField',
                type:'autocomplete',
                label:'Автокомплит',
                multiple:true,
                placeholder:'Заполните',
                apollo:{
                    query:gql`
                        query ListCities($pagination:PaginationOptions){
                            cities{
                                list(pagination:$pagination){
                                    rows{
                                        name,_id
                                    }
                                }
                            }
                        }
                    `,
                    variables(options){
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
                        return _.chain(data.cities.list.rows)
                        .map((city)=>{
                            return {id:city._id,label:city.name}
                        })
                        .value();
                    }
                }
            }
        ]
    };
    export default {
        name:'Test',
        data(){
            //console.log({FileMutation});
            return {
                model:{
                    autocompleteField:'2ce1760311ae565c83cf3ab79d3ff132'
                },
                schema:schema
            }
        },
        methods:{

        }
    }
</script>