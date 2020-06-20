import  abstractField  from "../fields/abstractField";
import _ from 'underscore';
import QueryBuilder from './querybuilder.standalone';
import QueryBuilderRu from './query-builder.ru';
import $ from 'jquery';
import {uniqueId} from 'lodash'

    QueryBuilder();
    QueryBuilderRu();

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
        search (val) {
            this.querySelections(val)
        },
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
            if(!this.updatedByUser&&this.$el){
                let $el = $(this.$el);
                if(!this.builderInitialized) {

                    let filters = this.schema.filters;
                    if(_.isFunction(filters)){
                        filters = filters.apply(this);
                    }

                    try {
                        $el.queryBuilder({
                            rules: this.value,
                            filters: filters,
                            allow_empty: typeof (this.schema.allow_empty) != 'undefined' ? this.schema.allow_empty : undefined,
                            allow_invalid: typeof (this.schema.allow_invalid) != 'undefined' ? this.schema.allow_invalid : undefined,
                            allow_groups: typeof (this.schema.allow_groups) != 'undefined' ? this.schema.allow_groups : undefined,
                        });
                    }catch (e) {
                        $el.queryBuilder('setRules',undefined);
                        console.error(e);
                    }

                    $el.on('afterAddGroup.queryBuilder afterAddRule.queryBuilder afterDeleteRule.queryBuilder afterCreateRuleFilters.queryBuilder afterCreateRuleOperators.queryBuilder ' +
                        ' afterUpdateRuleValue.queryBuilder afterUpdateRuleFilter.queryBuilder afterUpdateRuleOperator.queryBuilder afterUpdateGroupCondition.queryBuilder afterSetFilters.queryBuilder ' +
                        'afterInvert.queryBuilder'
                        // eslint-disable-next-line no-unused-vars
                        , (e, rule, error, value) => {
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