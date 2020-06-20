import VueSchemaBuilder from "../../VueSchemaBuilder";
import _ from 'underscore';
import {get as safeGet,cloneDeep} from 'lodash';
import {graphqlClone} from "../../../lib/utils";

export default {
    name: 'GrapqlFormMixin',
    props: {
        'mode':{type:String},
        'preload':{},
        'schema':{},
        'events':{type:Object},
        'buttons':{
            default() {
                return function(){
                    return this.buttonsDefault();
                }
            }
        },
        'apollo':{type:Object},
    },
    data () {
        return {
            changed:false,
            currentUpload:null,
            loaded:false
        }
    },
    methods:{
        graphqlClone(){
            let schemaKeys = _.chain(this.computedSchema.fields)
            .map((field)=>{
                return field.model;
            })
            .value();
            let oddKeys = _.difference(_.keys(this.model),schemaKeys);
            let cloned = graphqlClone(this.model,oddKeys);
            return cloned;
        },
        // eslint-disable-next-line no-unused-vars
        onModelUpdated(newModel,schema){
            this.changed=true;
            this.$emit('model-updated',newModel,schema);
            console.log('onModelUpdated');
        },
        onCancel() {
            this.$emit('cancel');
            if(this.events && this.events.cancel){
                this.events.cancel.apply(this);
            }
        },
        async onSubmit(){
            if(this.apollo&&this.apollo.queries&&this.apollo.queries.validate) {
                let validateQuery = _.clone(this.apollo.queries.validate);
                if(_.isFunction(validateQuery.variables)){
                    validateQuery.variables = validateQuery.variables.apply(this);
                }
                validateQuery.markLoading=false;
                let validateResult = await this.apolloQuery(validateQuery);
                try {
                    const findLastChildForPath=function($vm,path){
                        let result = null;
                        _.each($vm.$children,($child)=>{
                            let $nextChild = findLastChildForPath($child,path);
                            if($nextChild)
                                result = $nextChild;
                            if(!result) {
                                if ($child.validate && $child.field && $child.errors && path === $child.path) {
                                    result = $child;
                                }
                            }
                        });
                        return result;
                    };
                    let data = safeGet (validateResult,'data',null);
                    if(!_.isEmpty(data)){
                        let gqlRoot = _.first(_.keys(data));
                        let errors = safeGet( data[gqlRoot], 'validate.errors',[]);
                        if(!_.isEmpty(errors)){
                            _.each(errors,(errData)=>{
                                let $input = findLastChildForPath(this,errData.field);
                                if($input) {
                                    let hasTargetError = ! _.chain($input.errors)
                                    .filter(($error)=>{
                                        return $error.field && $error.field.model === errData.field;
                                    })
                                    .isEmpty()
                                    .value();
                                    if ( !hasTargetError ) {
                                        $input.errors.push ({
                                            error: errData.message,
                                            field: $input.field
                                        })
                                    }
                                }
                            });
                        }
                        if(!_.isEmpty(errors))
                            return;
                    }
                }catch (e) {
                    this.flash(String(e), 'error', {
                        timeout: 30000
                    });
                }
            }

            let mutationData = this.mode == 'create' ? this.apollo.mutations.create : this.apollo.mutations.update;
            mutationData = _.clone(mutationData);
            if(_.isFunction(mutationData.variables)){
                mutationData.variables = mutationData.variables.apply(this);
            }
            mutationData.context = mutationData.context||{};
            mutationData.context.fetchOptions = mutationData.context.fetchOptions||{};

            const fetchOptions = _.clone(mutationData.context.fetchOptions);

            this.currentUpload = {progress:0};
            const self = this;
            mutationData.context.fetchOptions.onprogress = function($event){
                self.currentUpload.progress = ($event.loaded / $event.total )*100;
                if(fetchOptions.onprogress){
                    fetchOptions.onprogress.apply(this,[$event]);
                }
            };

            mutationData.context.fetchOptions.onload = function($event){
                self.currentUpload=null;
                if(fetchOptions.onload){
                    fetchOptions.onload.apply(this,[$event]);
                }
            };

            mutationData.context.fetchOptions.onerror = function($event){
                self.currentUpload=null;
                if(fetchOptions.onerror){
                    fetchOptions.onerror.apply(this,[$event]);
                }
            };



            try {
                let wasErrors = false;
                let response = await this.$apollo.mutate (mutationData);
                let data = response.data;
                if(data){
                    let val = _.first(_.values(data) );
                    if(val){
                        val = _.first(_.values(val) );
                        if(val&&!_.isEmpty(val.errors)){
                            _.each(val.errors,(errString)=>{
                                this.flash(errString, 'error', {
                                    timeout: 10000
                                });
                                wasErrors = true;
                            });
                        }
                    }
                }
                if(!wasErrors) {
                    this.$emit ('submit', response);
                    if (this.events && this.events.submit) {
                        this.events.submit.apply (this, [response]);
                    }
                }
            }catch (e) {
                this.flash(e.message, 'error', {
                    timeout: 10000
                });
                console.error(e);
            }
        },

        buttonsDefault(){
            return [
                {
                    "name":'successButton',
                    "type": "submit",
                    "buttonText": "Готово",
                    "readonly": false,
                    "featured": false,
                    "disabled": false,
                    "onSubmit": _.bind(this.onSubmit, this),
                    validateBeforeSubmit: true,
                    styleClasses: ' col-',
                    fieldClasses: 'btn btn-success',
                    visible: () => {
                        if(this.mode == 'create')
                            return true;
                        if(this.mode=='update')
                            return this.model && this.model._id && this.changed;
                    }
                }, {
                    "name":'cancelButton',
                    "type": "submit",
                    "buttonText": "Отмена",
                    "readonly": false,
                    "featured": false,
                    "disabled": false,
                    "onSubmit": _.bind(this.onCancel, this),
                    visible: () => {
                        if(this.mode == 'create')
                            return false;
                        if( this.mode=='update')
                            return this.model && this.model._id && this.changed;
                    },
                    styleClasses: ' col-',
                    fieldClasses: 'btn btn-danger'
                }
            ];
        }
    },

    async created(){
        let loaded = this.markLoading();
        try {
            if(this.preload && _.isFunction(this.preload)){
                await this.preload.apply(this);
            }
            if (this.apollo && this.apollo.queries) {
                let queryData = this.mode === 'create' ? this.apollo.queries.create : this.apollo.queries.update;
                if (queryData) {
                    queryData = cloneDeep (queryData);
                    if (queryData.variables && _.isFunction (queryData.variables)) {
                        queryData.variables = queryData.variables.apply (this, []);
                    }

                    let response = await this.apolloQuery (queryData);
                    if (response && response.data) {
                        let update = queryData.update;
                        if (!update) {
                            update = function (response) {
                                let root = _.first (_.keys (response));
                                this[root] = response[root];
                            };
                        }
                        await update.apply (this, [response.data]);
                    }
                }
            }
            if (this.$attrs && this.$attrs.initModel) {
                this.model = _.isFunction (this.$attrs.initModel) ? await this.$attrs.initModel.apply (this) : cloneDeep (this.$attrs.initModel);
            }
            this.loaded = true;
            this.changed = false;
        }finally {
            loaded();
        }
    },

    watch: {
        model: {
            deep:true,
            immediate:true,
            handler: function (newModel) {
                this.privateModel = newModel;
            }
        }
    },

    recomputed:{
        computedSchema(){
            let schema = _.isFunction( this.schema ) ? this.schema.apply(this) : this.schema;
            let buttonFields = _.isFunction(this.buttons)?this.buttons.apply(this):this.buttons;
            return  new VueSchemaBuilder(schema)
            .withFields(buttonFields)
            .build();
        }
    },
    computed:{
        requestProgressInt(){
            return safeGet( this.currentUpload,'progress',0);
        },
        requestProgressFloat(){
            let progress = safeGet( this.currentUpload,'progress',0);
            return progress.toFixed(2);
        },
        requestProgressStyle(){
            return `width: ${this.requestProgressInt}%;`;
        }
    }
}