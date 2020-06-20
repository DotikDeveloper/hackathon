<template>
    <div ref="root" style="width:100%;">
        <vue-tabs active-tab-color="#008F11"
                  active-text-color="white"
                  type="pills"
                  :start-index="1"
                  @tab-change="handleTabChange"
        >

            <v-tab
                    v-for="(item, index) in value"
                    :key="item.name"
                    :title="item.name"
                    icon="ti-user">
                <div slot="title">{{item.name}}
                    <span v-if="!item.required" @click.stop="deleteItem(item,index)" class="ti-close tab-close"></span>
                </div>
                <div style="width: 100%;">
                    <codemirror
                            v-model="item.expression"
                            :options="codeMirrorOptions"
                            @input="onCodeMirrorChange($event,item)"
                            name="item.name"
                    >
                    </codemirror>
                </div>
            </v-tab>


        </vue-tabs>

        <input type="text" id="addItemInput"/> <button  v-on:click="addItem()">Добавить</button>
    </div>
</template>
<script>
import  abstractField  from "../fields/abstractField";
import 'vue-nav-tabs/themes/vue-tabs.css'
import 'vue-nav-tabs/themes/material.css';
import './themify-icons.css';
import EJSON from 'ejson';
import CodeMirror from './../codemirror/codemirror';
import './../codemirror/codemirror.css';
import $ from 'jquery';
import _ from 'underscore';
import {VueTabs, VTab} from 'vue-nav-tabs/dist/vue-tabs'
//you can also import this in your style tag
import 'vue-nav-tabs/themes/vue-tabs.css'
import codemirror from './../codemirror/codemirror';
export default {
    components:{
        'v-tab':VTab,
        'vue-tabs':VueTabs,
        codemirror
    },
    data(){
        return{
            editors:[]
        };
    },

    watch:{
        value:{
            immediate:true,
            // eslint-disable-next-line no-unused-vars
            handler(newValue,oldValue){
                let changed = false;
                if(!_.isArray(newValue)){
                    newValue = [];
                    changed = true;
                }
                if(!_.isEmpty(this.schema.requiredNames)){
                    _.each(this.schema.requiredNames,(requiredName)=>{
                        if(!_.find(newValue,(item)=>{
                            return item.name == requiredName;
                        })){
                            newValue.push({
                                name:requiredName,
                                expression:'',
                                required:true
                            });
                            changed = true;
                        }
                    });
                }

                _.each(newValue,(item)=>{
                    if( item.required && ( !_.isArray(this.schema.requiredNames) || this.schema.requiredNames.indexOf(item.name)==-1 ) ){
                        item.required = false;
                        changed=true;
                    }
                });

                if(changed) {
                    this.$nextTick(()=>{
                        this.value = EJSON.clone(newValue);
                    });
                }
            }
        }
    },

    updated(){
        this.$nextTick(()=>{
            let $rootNode = $( this.$refs.root );
            let $tabContainer = $rootNode.find('.tab-container').first();
            if($tabContainer) {
                this.handleTabChange (0, {$el:$tabContainer}, undefined);
            }
        });
    },
    computed:{
        codeMirrorOptions(){
            let opts = {};
            if(this.schema.codeMirrorOptions){
                opts = EJSON.clone(this.schema.codeMirrorOptions);
            }
            opts.autoRefresh = true;
            console.log(opts)
            return opts;
        }
    },

    methods:{
        deleteBlockStyle(){
            let size = Math.round(20);
            if(size<7)
                size = 7;
            let offset = Math.round(size/2);
            return `position: absolute; top: -${offset}px; right: -${offset}px;height:${size}px;width:${size}px;`;
        },
        deleteImageStyle(){
            let size = Math.round(20 );
            if(size<7)
                size = 7;
            return `z-index:100000;width:${size}px;height:${size}px;display: block; padding:0; `;
        },
        deleteItem($item){
            let items = _.filter(this.value,(item)=>{
                return item.name !== $item.name;
            });
            this.value = items;
        },
        addItem(){
            let val = $('#addItemInput').val();
            if(val&&_.pluck(this.value,'name').indexOf(val)==-1){
                this.value.push({
                    name:val,
                    expression:'',
                    required:false
                })
            }
        },
        // eslint-disable-next-line no-unused-vars
        handleTabChange(tabIndex, newTab, oldTab){
            if(newTab){
                this.$nextTick(()=>{
                    return;
                    // eslint-disable-next-line no-unreachable
                    if(!this.editors[tabIndex]) {
                        // eslint-disable-next-line no-unused-vars
                        $(newTab.$el).find('textarea').each(function (index) {
                            let $textArea = $(this);

                            CodeMirror.fromTextArea(this, {
                                lineNumbers: true
                            });
                            $textArea.attr('editor', '1');

                        });
                        // eslint-disable-next-line no-unreachable
                        this.editors[tabIndex] = true;
                    }
                });
            }
        },
        // eslint-disable-next-line no-unused-vars
        onChange($event){

        },
        onCodeMirrorReady(){

        },
        onCodeMirrorFocus(){

        },
        onCodeMirrorChange($event,item){
            console.log('onCodeMirrorChange:','$event:',$event,'item:',item);
        }
    },
    mixins: [ abstractField ]
}

</script>