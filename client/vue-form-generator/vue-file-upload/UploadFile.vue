<template>
    <div>
        <div v-if="value">
            <ul v-if="schema.multiple">
                <!--
                <template v-if="!!schema.itemComponent">
                    <li :key="index" v-for="(item,index) in items" >
                        <component v-if="!!schema.itemComponent" :is="schema.itemComponent" :model="item"></component>
                    </li>
                </template>
                -->
                <template v-if="schema.itemComponent">
                    <vue-form-generator
                            :schema="arraySchema" :model="{items:items}"
                            @model-updated="onItemsUpdated"
                    >

                    </vue-form-generator>
                </template>

            </ul>
            <div v-else-if="!!schema.itemComponent">
                <component :key="index" v-for="(item,index) in items" :is="schema.itemComponent" :model="item"></component>
            </div>


            <!-- <a :href="link" target="_blank" download>{{file.name}}</a>
             <audio v-if="audioPreview" :src="link" controls></audio>
             -->
        </div>

        <div>
            <input
                    :id="getFieldID(schema)"
                    :class="fileClasses()"
                    type="file"
                    :accept="accept"
                    @change="onFileChanged($event)"
                    :multiple="schema.multiple"
            />
        </div>
    </div>
</template>

<script>
    import  abstractField  from "../fields/abstractField";
    import _ from 'underscore';
    import {get as safeGet} from 'lodash';

    export default {
        mixins: [ abstractField ],
        data(){
            return{
                currentUpload:null,
                items:[]
            };
        },

        computed:{
            accept(){
                if(_.isEmpty(this.schema.accept))
                    return '';
                return _.chain( this.schema.accept )
                .map((ext)=>{
                    return `.${ext}`;
                })
                .value()
                .join(',');
            },
            audioPreview(){
                let isAudioFile = this.file && this.file.isAudio;
                return this.schema.preview=='audio' || ( this.schema.preview=='auto' && isAudioFile );
            },
            progressStyle(){
                return `width: ${this.currentUpload.progress.get()}%`;
            },
            arraySchema(){
                return {
                    fields:[{
                        type:'array',
                        itemContainerComponent:this.schema.itemComponent,
                        model:'items',
                        showNewElementButton:false,
                        disableBorderLeft:true
                    }]
                }
            }
        },
        methods:{
            fileClasses(){
                let fileClasses = _.clone(this.schema.class);
                if(!fileClasses)
                    fileClasses=[];
                if(_.isString(fileClasses))
                    fileClasses=[fileClasses];
                if(fileClasses.indexOf('custom-file')==-1)
                    fileClasses.push('custom-file');
                return fileClasses;
            },
            onDrop($event){
                console.log($event);
            },
            async onFileChanged($event){
                console.log({onchange:$event});
                let value = this.schema.multiple ? $event.target.files : _.first($event.target.files);
                let mutationData = safeGet(this.schema.apollo,'mutation',null);
                if(mutationData) {
                    let $mutation = _.clone(mutationData);
                    delete $mutation.update;
                    if (_.isFunction ($mutation.variables)) {
                        $mutation.variables = $mutation.variables.apply(this, [value]);
                    }
                    let response = await this.$apollo.mutate($mutation);
                    if(mutationData.update){
                        let val = mutationData.update.apply(this,[response]);
                        if(val) {
                            if (this.schema.multiple) {
                                let newVal = this.value;
                                if (!_.isArray (newVal)) {
                                    newVal = [];
                                }
                                if (_.isArray (val))
                                    newVal = newVal.concat(val);
                                else
                                    newVal.push(val);
                                this.value = newVal;
                            } else {
                                this.value = val;
                            }
                        }
                    }
                    console.log({response});
                }
            },

            updated() {
                this.$nextTick(function () {
                    this.file = this.schema.collection.findOne(this.value);
                })
            },
            fileIcon(file){
                let ext = file.name.split('.').pop();
                if(ext){
                    ext = ext.toLowerCase();
                }
                if(ext)
                    return `https://raw.githubusercontent.com/eagerterrier/MimeTypes-Link-Icons/master/images/${ext}-icon-48x48.gif`;
                return  '';
            },

            onItemsUpdated(items){
                if(this.schema.multiple){
                    this.value = _.pluck(items,'_id');
                }else{
                    this.value = safeGet( _.first(items),'_id',null );
                }
            }
        },

        created(){
        },

        watch:{
            value:{
                immediate:true,deep:true,
                async handler(newValue){
                    if(_.isEmpty(newValue)){
                        this.items = [];
                        return;
                    }
                    if(typeof newValue!=='undefined') {
                        if(this.schema && this.schema.apollo && this.schema.apollo.query) {
                            let $query = _.clone (this.schema.apollo.query);
                            if(_.isFunction($query.variables)){
                                $query.variables = $query.variables.apply(this,[newValue]);
                            }
                            let update = $query.update || ( ()=>{} );
                            delete $query.update;
                            let response = await this.apolloQuery ($query );
                            update.apply(this,[response.data]);
                        }
                    }
                }
            }
        }

    }
</script>