<template>
    <div>
        <template v-if="header">
            <component :is="header" v-bind="buildComponentParams(headerParams)"></component>
        </template>
    <vue-good-table
            mode="remote"
            @on-page-change="onPageChange"
            @on-per-page-change="onPageChange"

            @on-sort-change="onSortChange"
            @on-column-filter="onFilterChange"

            :totalRows="totalRecords"
            :isLoading="$apolloLoading"
            :pagination-options="{enabled: true}"
            :rows="rows"
            :columns="columns">

        <template slot="table-row" slot-scope="props">
            <template v-if="props.column.component">
                <component :is="props.column.component" v-bind="buildComponentParams(props.column.componentParams,props.row,props.column)"></component>
            </template>
            <template  v-else-if="props.column.components">
                <div v-bind:key="index"  v-for="(componentData,index) in props.column.components">
                    <component :is="componentData.component" v-bind="buildComponentParams(componentData.componentParams,props.row,props.column)"></component>
                </div>
            </template>
            <template v-else>
                <span v-if="!props.column.html">
                    {{ collectFormatted(props.row, props.column) }}
                </span>
                <span v-if="props.column.html" v-html="collect(props.row, props.column.field)" ></span>
            </template>
        </template>

    </vue-good-table>
    </div>
</template>
<!--@on-column-filter="" -->
<script>
    import _ from 'underscore';
    import EJSON from 'ejson';
    const defaultType = null;//TODO
    export default {
        name: 'GrapqlPagination',
        props: {
            header:{
                type:String,
                default:null
            },
            headerParams:{
                default:null
            },

            query:{type:Object},
            columns:{type:Array},
            pagination:{
                type:Object,
                default:null
            }
        },
        data () {
            return {
                rows:[],
                totalRecords: 0,
                serverParams: {
                    filters: {},
                    sort: {},
                    page: 1,
                    perPage: 10
                },
                apolloquery:{}
            }
        },
        methods:{
            onPageChange(newProps) {
                this.serverParams.page = newProps.currentPage;
                this.serverParams.perPage = newProps.currentPerPage;
                this.refreshRows();
            },

            onSortChange(params) {
                let $sort = {};
                _.each(params,(sortItem)=>{
                    $sort[sortItem.field] =  sortItem.type == 'asc'?1:-1;
                });
                this.serverParams.sort = $sort;
                this.refreshRows();
            },

            onFilterChange(params){
                let filters = {};
                _.each(params.columnFilters,($input,field)=>{
                    let $column = _.find(this.columns,($columnItem)=>{
                        return $columnItem.field == field;
                    });
                    if(!$column||!$column.filterOptions)
                        return;
                    if($column.filterOptions.transform){
                        $input = $column.filterOptions.transform.apply(this,[$input]);
                        if($input===undefined){
                            return;
                        }
                    }
                    filters[field]=$input;
                });
                this.serverParams.filters = filters;
                this.refreshRows();
            },

            refreshRows(){
                let query = _.clone( this.query );
                let variables = query.variables;
                if(!variables){
                    variables = {pagination:this.serverParams};
                }else if(_.isFunction(query.variables)){
                    variables = query.variables.apply(this);
                }
                variables = EJSON.clone(variables);
                this.$apollo.queries.apolloquery.refetch(variables).then((data)=>{
                    this.query.update.apply(this,[data.data]);
                });
            },

            collectFormatted(obj, column, headerRow = false) {
                let value;
                if (headerRow && column.headerField) {
                    value = this.collect(obj, column.headerField);
                } else {
                    value = this.collect(obj, column.field);
                }
                if (value === undefined) return '';
                // if user has supplied custom formatter,
                // use that here
                if (column.formatFn && typeof column.formatFn === 'function') {
                    return column.formatFn.apply(obj,[value]);
                }
                // lets format the resultant data
                let type = column.typeDef;
                // this will only happen if we try to collect formatted
                // before types have been initialized. for example: on
                // load when external query is specified.
                if (!type) {
                    type = this.dataTypes[column.type] || defaultType;
                }
                return type.format(value, column);
            },

            // field can be:
            // 1. function
            // 2. regular property - ex: 'prop'
            // 3. nested property path - ex: 'nested.prop'
            collect(obj, field) {
                // utility function to get nested property
                function dig(obj, selector) {
                    let result = obj;
                    const splitter = selector.split('.');
                    for (let i = 0; i < splitter.length; i++) {
                        if (typeof result === 'undefined' || result === null) {
                            return undefined;
                        }
                        result = result[splitter[i]];
                    }
                    return result;
                }
                if (typeof field === 'function') return field(obj);
                if (typeof field === 'string') return dig(obj, field);
                return undefined;
            },

            buildComponentParams(componentParams,row,column){
                if(typeof componentParams=='undefined'){
                    return {};
                }
                if(_.isFunction(componentParams)){
                    return componentParams.apply(this,[row,column]);
                }
                return componentParams;
            }
        },

        computed:{
            computedQuery(){
                return _.clone( this.query );
            }
        },

        watch:{
            computedQuery:{
                immediate:true,
                deep:true,
                handler(){
                    if(this.pagination){
                        this.serverParams = this.pagination;
                    }
                    let query = _.clone( this.query );
                    let variables = query.variables;
                    if(!variables){
                        variables = {pagination:this.serverParams};
                    }else if(_.isFunction(query.variables)){
                        variables = query.variables.apply(this);
                    }
                    query.variables=EJSON.clone( variables );
                    this.$apollo.addSmartQuery('apolloquery', query);
                }
            }
        }
    }
</script>