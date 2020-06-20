<script>
    import GraphqlForm from "../../../../client/components/GraphqlForm";
    import gql from 'graphql-tag';
    import _ from 'underscore';
    import VueSchemaBuilder from "../../../../client/VueSchemaBuilder";
    import CustomQueryFilter from "../../../../lib/CustomQueryFilter";
    import {FILTER_MODE} from "../../../../lib/enums";
    import {RULE_MODE} from "../../enums";
    import {codemirror, userId} from "/client/vue-form-generator/schemaBoilerplates";

    function schemaFactory(){
        return {
            fields:[
                {
                    model:'name',
                    label:'Имя',
                    type:'input',inputType:'text'
                },
                {
                    model:'roles',
                    type:'autocomplete',
                    label:'Роли',
                    multiple:true,
                    placeholder:'Выберите...',
                    apollo:{
                        query:gql`
                        query AclRolesAutocomplete($pagination:PaginationOptions){
                            aclRoles{
                                list(pagination:$pagination){
                                    rows{
                                        name label
                                    }
                                }
                            }
                        }
                    `,
                        variables:(options)=>{
                            let filters = {};
                            if(options.term){
                                filters.label = new RegExp(options.term,'i');
                            }
                            if(options.ids){
                                filters.name = {$in:options.ids};
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
                            return _.chain(data.aclRoles.list.rows)
                            .map((m)=>{
                                return {id:m.name,label:m.label};
                            })
                            .value();
                        }
                    },
                    validator(value){
                        if(_.isEmpty(value)){
                            return ['Роли не могут быть пусты']
                        }
                        return [];
                    }
                },{
                    model:'resources',
                    type:'autocomplete',
                    label:'Ресурсы',
                    multiple:true,
                    placeholder:'Выберите...',
                    apollo:{
                        query:gql`
                        query AclFiltersAutocomplete($pagination:PaginationOptions){
                            aclFilters{
                                resourceNames(pagination:$pagination){
                                    rows{
                                        name label
                                    }
                                }
                            }
                        }
                    `,
                        variables (options){
                            let filters = {};
                            if(options.term){
                                filters.label = new RegExp(options.term,'i');
                            }
                            if(options.ids){
                                filters.name = {$in:options.ids};
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
                            return _.chain(data.aclFilters.resourceNames.rows)
                            .map((m)=>{
                                return {id:m.name,label:m.label};
                            })
                            .value();
                        }
                    },
                    validator(value){
                        if(_.isEmpty(value)){
                            return ['Ресурсы не могут быть пусты']
                        }
                        return [];
                    }
                },{
                    model:'actions',
                    type:'autocomplete',
                    label:'Действия',
                    multiple:true,
                    placeholder:'Выберите...',
                    apollo:{
                        query:gql`
                        query AclActionsAutocomplete($pagination:PaginationOptions $resources:[String]){
                            aclRules{
                                actions(pagination:$pagination,resources: $resources){
                                    rows{
                                        name label
                                    }
                                }
                            }
                        }
                    `,
                        variables:(options)=>{
                            let filters = {};
                            if(options.term){
                                filters.label = new RegExp(options.term,'i');
                            }
                            if(options.ids){
                                filters.name = {$in:options.ids};
                            }
                            let page = options.page || 0;
                            let perPage = options.perPage||100;

                            return {
                                resources:this.model?this.model.resources:[],
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
                            return _.chain(data.aclRules.actions.rows)
                            .map((m)=>{
                                return {id:m.name,label:m.label};
                            })
                            .value();
                        }
                    },
                    validator(value){
                        if(_.isEmpty(value)){
                            return ['Ресурсы не могут быть пусты']
                        }
                        return [];
                    }
                },
                {
                    model:'mode',
                    type:'select',
                    label:'Режим',
                    values:RULE_MODE.toSelect(),
                    required:true,
                    default(){
                        return RULE_MODE.allow_rules.key;
                    },
                    validator(value){
                        if(!RULE_MODE[value]){
                            return ['Недопустимое значение'];
                        }
                        return [];
                    }
                },
                {
                    model:'rules',
                    type: "QueryBuilder",
                    styleClasses:'',
                    allow_empty:true,
                    allow_invalid:false,
                    allow_groups:true,
                    filters: this.filters,
                    label:'Правила',
                    visible(model){
                        return model.mode === RULE_MODE.allow_rules.key;
                    },
                    // eslint-disable-next-line no-unused-vars
                    validator:(value,model)=>{
                        if(_.isEmpty(this.filters))
                            return ['Недопустимые правила'];
                        return [];
                    }
                },{
                    ...codemirror(),
                    model:'conditionExpr',
                    required:true,
                    label:'Код, возвращающий mongo selector',
                    visible(model){
                        return model && model.mode === RULE_MODE.condition_expression.key;
                    }
                },{
                    ...userId(),
                    label:'Владелец'
                }
            ]
        }
    }

    export default {
        mixins:[GraphqlForm],
        data(){
            return {
                key:'',
                filters:[],
            }
        },
        mounted () {
            // eslint-disable-next-line no-unused-vars
            let unwatch = this.$watch("model.resources", async (newValue)=>{
                console.log({newValue});
                let key = ( newValue || [] ).join(',');
                if(key!==this.key) {
                    this.key = key;
                    await this.$apollo.queries.filters.refetch();
                    //this.$forceUpdate();
                }
            }, { deep: true,immediate:true });
        },
        apollo:{
            filters:{
                query:gql`
                query AclRulesFilters($resources:[String]){
                    aclRules{
                        filters(resources:$resources)
                    }
                }
`,
                variables(){
                    return {resources:this.model ?this.model.resources:[]}
                },
                update(data){
                    //return data.aclRules.filters;
                    return _.chain(data.aclRules.filters)
                    .map((filter)=>{
                        return new CustomQueryFilter({
                            ...filter,
                            mode:_.size(filter.variables)>0?FILTER_MODE.variable.key:FILTER_MODE.expression.key
                        }).filter()
                    })
                    .value();
                }
            }
        },
        recomputed:{
            computedSchema(){
                let schema = schemaFactory.apply(this);
                let buttonFields = _.isFunction(this.buttons)?this.buttons.apply(this):this.buttons;
                return  new VueSchemaBuilder(schema)
                .withFields(buttonFields)
                .build();
            },
        }
    }
</script>