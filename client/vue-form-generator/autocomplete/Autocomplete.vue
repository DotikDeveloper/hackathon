<template>
    <div ref="container" style="width:300px;">
        <select ref="select" v-bind="selectAttrs()" style="width: 300px">
        </select>
    </div>
</template>
<script>
    import 'select2/dist/css/select2.min.css';
    import $ from 'jquery';
    window.jQuery = window.jQuery || $;
    import 'select2/dist/js/select2.js'
    import '@ttskch/select2-bootstrap4-theme/dist/select2-bootstrap4.css';
    import _ from 'underscore';
    import abstractField from "../fields/abstractField";
    import './i18n/ru';
    import {get as safeGet} from 'lodash';
    import EJSON from 'ejson';

    export default {
        name:'field-autocomplete',
        mixins: [ abstractField ],
        props: {

        },
        data () {
            return {
                select2:null
            }
        },
        async mounted() {
            let $select = $( this.$refs.select );
            $select.select2({
                dropdownParent: this.$refs.container,
                placeholder: this.schema.placeholder||'',
                theme: 'bootstrap4',
                language: "ru",
                ajax: {
                    // eslint-disable-next-line no-unused-vars
                    transport: async (params, success, failure) => {
                        let page = safeGet(params,'data.page',1);
                        let opts = {
                            term:safeGet(params,'data.term',null),
                            page:page,
                            perPage:this.limit
                        };
                        let results = await this.load(opts);
                        return success ({
                            results: results,
                            "pagination": {
                                "more": _.size(results)>=this.limit
                            }
                        });
                    }
                }
            });
            $select.on('change', ()=>{
                if(EJSON.stringify($select.val())!==EJSON.stringify(this.value))
                    this.value = $select.val();
            });

            if(!_.isEmpty(this.value)){
                let opts = {
                    term:null,
                    ids:this.ids,
                    page:1,
                    perPage:this.limit
                };
                let results = await this.load(opts);
                _.each(results,(result)=>{
                    let newOption = new Option(result.text, result.id, false, true);
                    $select.append(newOption).trigger('change')
                });
            }
        },
        computed: {
            ids(){
                if(!this.multiple&&this.value){
                    return [this.value];
                }else if(this.multiple){
                    return this.value||[];
                }
                return [];
            },
            models(){
                let result = [];
                if(this.$refs) {
                    let $options = $ (this.$refs.select).find (':selected');
                    $options.each (() => {
                        let $option = $ (this);
                        result.push ({
                            id: $option.val (),
                            text: $option.text ()
                        });
                    });
                }
                return result;
            },
            limit(){
                return safeGet(this.schema,'limit',100);
            },
            multiple(){
                return this.schema.multiple;
            }
        },
        watch: {
            value:{
                immediate:true,
                // eslint-disable-next-line no-unused-vars
                handler(newVal){
                    if(this.$refs.select) {
                        let $select = $( this.$refs.select );
                        if (EJSON.stringify ($select.val ()) !== EJSON.stringify(newVal)) {
                            this.$nextTick (() => {
                                $select.val(newVal);
                                $select.trigger ('change');
                            });
                        }
                    }
                }
            }
        },
        methods: {
            async load(opts){
                let term = safeGet(opts,'term',null);
                let ids = safeGet(opts,'ids',null);
                if(_.isEmpty(ids)){
                    ids = null;
                }
                let models = [];
                if (this.schema.apollo) {
                    if(ids){
                        let idsOpts = EJSON.clone(opts)
                        idsOpts.page = opts.page||1;
                        idsOpts.perPage = _.size(ids);

                        let data = await this.apolloQuery({
                            ...this.schema.apollo,
                            variables:()=>{
                                if (_.isFunction (this.schema.apollo.variables)) {
                                    return  this.schema.apollo.variables(idsOpts);
                                }
                                return {
                                    term: null,
                                    ids: ids
                                };
                            }
                        });

                        if (_.isFunction (this.schema.apollo.update)) {
                            models = this.schema.apollo.update.apply (this, [data.data]);
                        }else{
                            models = data.data;
                        }
                    }
                    if(term||(_.isString(term)&&term.length>0)||!ids){
                        let termOpts = EJSON.clone(opts);
                        delete termOpts.ids;
                        let data = await this.apolloQuery({
                            ...this.schema.apollo,
                            variables:()=>{
                                if (_.isFunction (this.schema.apollo.variables)) {
                                    return  this.schema.apollo.variables(termOpts);
                                }
                                return {
                                    term: term
                                };
                            }
                        });
                        if (_.isFunction (this.schema.apollo.update)) {
                            models = models.concat (models, this.schema.apollo.update.apply (this, [data.data]));
                        } else {
                            models = models.concat (models, data.data);
                        }
                    }
                }

                let modelIds = _.pluck(this.models,'id');
                let results = _.chain(models)
                .indexBy('id')
                .values()
                .filter((model)=>{
                    return modelIds.indexOf(model.id)==-1;
                })
                .map((model)=>{
                    return {
                        id:model.id,
                        text:model.label||model.text
                    }
                })
                .value();
                return results;
            },
            selectAttrs() {
                return {
                    multiple:this.multiple
                }
            }
        },
        destroyed(){
            console.log('autocomplete destroyed');
        },
    }
</script>
<style>
    [aria-selected=true]{
        display:none;
    }
</style>