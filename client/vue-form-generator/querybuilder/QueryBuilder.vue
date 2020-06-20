<template>
    <div class="builderRootDiv" :id="'querybuilder'+id">
    </div>
</template>

<script>
    import  abstractField  from "../fields/abstractField";
    import _ from 'underscore';
    import QueryBuilderFactory from './querybuilder.standalone';
    QueryBuilderFactory();
    import QueryBuilderRuFactory from './query-builder.ru';
    QueryBuilderRuFactory();
    import $ from 'jquery';
    import {uniqueId} from 'lodash'


    export default {
        mixins: [ abstractField ],
        data(){
            return {
                id:uniqueId(),
                updatedByUser:false,
                builderInitialized:false
            }
        },
        watch: {
            value:{
                immediate:true,
                // eslint-disable-next-line no-unused-vars
                handler(newVal){
                    this.onChange();
                }
            }
        },
        mounted(){
            this.onChange();
        },
        methods:{
            onChange(){
                console.log('QueryBuilder value:',this.value);
                if(!this.updatedByUser&&this.$el){
                    let $el = $(this.$el);
                    if(!this.builderInitialized) {
                        let filters = this.schema.filters;
                        if(_.isFunction(filters)){
                            filters = filters.apply(this);
                        }
                        if(_.isEmpty(filters))
                            return;
                        try {
                            $el.queryBuilder({
                                rules: this.value,
                                filters: filters,
                                allow_empty: typeof (this.schema.allow_empty) != 'undefined' ? this.schema.allow_empty : undefined,
                                allow_invalid: typeof (this.schema.allow_invalid) != 'undefined' ? this.schema.allow_invalid : undefined,
                                allow_groups: typeof (this.schema.allow_groups) != 'undefined' ? this.schema.allow_groups : undefined,
                                icons: {
                                    add_group: "material-icons querybuilder-button add_group",
                                    add_rule: "material-icons querybuilder-button add_rule",
                                    remove_group: "material-icons querybuilder-button remove_group",
                                    remove_rule: "material-icons querybuilder-button remove_rule",
                                    error: "material-icons querybuilder-button error"
                                }
                            });
                        }catch (e) {
                            try {
                                $el.queryBuilder('setRules',undefined);
                            }catch (e) {
                                console.error(e);
                            }
                        }

                        $el.on('afterAddGroup.queryBuilder afterAddRule.queryBuilder afterDeleteRule.queryBuilder afterCreateRuleFilters.queryBuilder afterCreateRuleOperators.queryBuilder ' +
                            ' afterUpdateRuleValue.queryBuilder afterUpdateRuleFilter.queryBuilder afterUpdateRuleOperator.queryBuilder afterUpdateGroupCondition.queryBuilder afterSetFilters.queryBuilder ' +
                            'afterInvert.queryBuilder'
                            // eslint-disable-next-line no-unused-vars
                            , (e, rule, error, value) => {
                                console.log('rules changed');
                                let rules = $el.queryBuilder('getRules', {
                                    allow_invalid: typeof (this.schema.allow_invalid) != 'undefined' ? this.schema.allow_invalid : undefined,
                                });
                                if (this.schema.changed) {
                                    this.schema.changed.apply(this, [$el, rules, error]);
                                }
                                this.updatedByUser = true;
                                this.value = rules;
                                this.$nextTick(() => {
                                    this.updatedByUser = false;
                                });
                            });
                        this.builderInitialized =true;
                    }else{
                        $el.queryBuilder('setRules',this.value);
                    }
                }
            },
            updated() {
                this.$nextTick(function () {
                    this.onChange();
                });
            }
        }
    }
</script>

<style>

    .rule-header{ display: inline }
    .error-container{ display: inline }
    .rule-filter-container{ display: inline }
    .rule-operator-container{ display: inline }
    .rule-value-container{ display: inline }



    /*!
     * jQuery QueryBuilder 2.4.1
     * Copyright 2014-2017 Damien "Mistic" Sorel (http://www.strangeplanet.fr)
     * Licensed under MIT (http://opensource.org/licenses/MIT)
     */
    .query-builder .form-control{
        font-size: inherit !important;
        padding: 6px 3px !important;
    }
    .query-builder .btn{
        padding: 5px 5px 5px 5px;
        vertical-align: middle;
        font-size: inherit !important;
    }
    .query-builder .btn-primary:not(.active){
        background-color: #BDC3CA  !important;
        border-color: #EAEFF3  !important;
    }
    .query-builder .rule-container,.query-builder .rule-placeholder,.query-builder .rules-group-container{
        position:relative;
        margin:4px 0;
        border-radius:5px;
        padding:5px;
        border:1px solid #EEE;
        background:rgba(255,255,255,.9)
    }
    .query-builder .drag-handle,.query-builder .error-container,.query-builder .rule-container .rule-filter-container,.query-builder .rule-container .rule-operator-container,.query-builder .rule-container .rule-value-container{
        display:inline-block;margin:0 5px 0 0;vertical-align:middle
    }
    .query-builder .rules-group-container{
        padding:10px 10px 6px;border:1px solid #DCC896;background:rgba(250,240,210,.5)
    }
    .query-builder .rules-group-header{
        margin-bottom:10px
    }
    .query-builder .rules-group-header .group-conditions .btn.readonly:not(.active),.query-builder .rules-group-header .group-conditions input[name$=_cond]{
        border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;
        position:absolute;width:1px;white-space:nowrap
    }
    .query-builder .rules-group-header .group-conditions .btn.readonly{
        border-radius:3px
    }
    .query-builder .rules-list{
        list-style:none;padding:0 0 0 15px;margin:0
    }
    .query-builder .rule-value-container{
        border-left:1px solid #DDD;padding-left:5px
    }
    .query-builder .rule-value-container label{
        margin-bottom:0;font-weight:400
    }
    .query-builder .rule-value-container label.block{
        display:block
    }
    .query-builder .rule-value-container input[type=number],.query-builder .rule-value-container input[type=text],.query-builder .rule-value-container select{
        padding:1px
    }
    .query-builder .error-container{
        display:none;cursor:help;color:red
    }
    .query-builder .has-error{
        background-color:#FDD;border-color:#F99
    }
    .query-builder .has-error .error-container{
        display:inline-block!important
    }
    .query-builder .dragging::after,.query-builder .dragging::before,.query-builder .rules-list>:last-child::after{
        display:none
    }
    .query-builder .rules-list>::after,.query-builder .rules-list>::before{
        content:'';position:absolute;left:-10px;width:10px;height:calc(50% + 4px);border-color:#CCC;border-style:solid
    }
    .query-builder .rules-list>::before{
        top:-4px;border-width:0 0 2px 2px
    }
    .query-builder .rules-list>::after{
        top:50%;border-width:0 0 0 2px
    }
    .query-builder .rules-list>:first-child::before{
        top:-12px;height:calc(50% + 14px)
    }
    .query-builder .rules-list>:last-child::before{
        border-radius:0 0 0 4px
    }
    .query-builder .error-container+.tooltip .tooltip-inner{
        color:#F99!important
    }
    .query-builder p.filter-description{
        margin:5px 0 0;background:#D9EDF7;border:1px solid #BCE8F1;color:#31708F;border-radius:5px;padding:2.5px 5px;font-size:.8em
    }
    .query-builder .rules-group-header [data-invert]{
        margin-left:5px
    }
    .query-builder .drag-handle{
        cursor:move;vertical-align:middle;margin-left:5px
    }
    .query-builder .dragging{
        position:fixed;opacity:.5;z-index:100
    }
    .query-builder .rule-placeholder{
        border:1px dashed #BBB;opacity:.7
    }

     /*malibun*/
    .query-builder .pull-right{
        float: right !important;
    }
    /*
    .query-builder {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        font-size: 12px !important;
        font-style: normal !important;
        font-variant-caps: normal !important;
        font-variant-east-asian: normal !important;
        font-variant-ligatures: normal !important;
        font-variant-numeric: normal !important;
        font-weight: 400 !important;
    }*/











    /* Mimic .fa */
    .glyphicon {
        display: inline-block !important;
        font: normal normal normal 14px/1 FontAwesome !important;
        font-size: 14px !important;
        font-size: inherit !important;
        text-rendering: auto !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
    }

    /* Mimic .fa-check-square-o */
    .glyphicon-check:before {
        content: '\f046';
    }
    .querybuilder-button{
        font-size: inherit;
        vertical-align: middle;
    }
    /* Mimic .fa-plus */
    .querybuilder-button.add_rule:before {
        content: 'add';
    }

    /* Mimic .fa-plus-circle */
    .querybuilder-button.add_group:before {
        content: 'add_circle_outline';
    }
    .glyphicon-random:before {
        content: '\f074';
    }
    .querybuilder-button.remove_group:before {
        content: 'remove_circle_outline';
    }
    .querybuilder-button.remove_rule:before{
        content: 'remove';
    }
    .querybuilder-button.error:before{
        content: 'error';
    }
    /* Mimic .fa-sort */
    .glyphicon-sort:before {
        content: '\f0dc';
    }

    /* Mimic .fa-square-o */
    .glyphicon-unchecked:before {
        content: '\f096';
    }

    /* Mimic .fa-warning */
    .glyphicon-warning-sign:before {
        content: '\f071';
    }

    .rules-group-header label.btn {
        cursor: pointer;
    }

    /* My custom CSS (Feel free to ignore) */
    .query-builder .rules-group-container {
        min-height: 20px;
        padding: 19px;
        margin-bottom: 10px;
        background-color: #f5f5f5;
        border: 1px solid #e3e3e3;
        border-radius: 14px;
        -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, .05);
        box-shadow: inset 0 1px 1px rgba(0, 0, 0, .05);
        width: 100%;
    }

    .custom-query-field-expression{
        resize: both;
    }

    /*.pull-right {
      float:right;
    }*/

</style>