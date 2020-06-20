<template>
    <div class="menuItem" :id="model._id" :style="style" v-on:click="onselect">

        <div :style="deleteBlockStyle">
            <a class="menuItemDeleteButton" :menuItemId="model._id"  href="#" :style="deleteImageStyle"
               v-on:click="$emit('deleteItem',model)"
            >
                <img :style="deleteImageStyle" title="Удалить" src="/sliver_close_button.png"/>
            </a>
        </div>

        <div class="ep" action="begin"></div>

        <span :style="labelStyle">{{model.label}}</span>

    </div>
</template>

<script>
    import $ from 'jquery';
    import {isset} from "../../../../server/lib/utils";
    import {uniqueId} from 'lodash';

    export default {
        name: "MenuItemView",
        data(){
            return {
                connections:[]
            }
        },
        computed: {
            deleteBlockStyle(){
                var size = Math.round(20*this.scale);
                if(size<7)
                    size = 7;
                let offset = Math.round(size/2);
                return `position: absolute; top: -${offset}px; right: -${offset}px;height:${size}px;width:${size}px;`;
            },
            deleteImageStyle(){
                var size = Math.round(20*this.scale);
                if(size<7)
                    size = 7;
                return `z-index:100000; width:${size}px; height:${size}px; display: block; padding:0; `;
            },
            fontSize(){
                let fontSize = Math.round(100*this.scale);
                if(fontSize<60)
                    fontSize=60;
                return fontSize;
            },
            labelStyle(){
                return `min-width:20px;font-size:${this.fontSize}%;margin:auto;opacity:1;`
            },
            style() {
                let left = Math.round(this.model.left*this.scale);
                let top = Math.round(this.model.top*this.scale);
                let width = parseInt( 50*this.scale );
                let height = width;
                if(width<20)
                    width=20;
                return `background-image: url("${this.model.menuBlock.imageFile?.urls?.small}");position:absolute;top:${top}px;left:${left}px;width:${width}px;height:${height}px;`
                +`background-repeat: no-repeat;`
                +`background-position: center center;background-size:100%;border:2px solid #a94442;padding-top:${height}px;`
            }
        },
        props:['model','jsplumb','scale'],

        watch: {
            scale: function () {
                this.$nextTick(()=>{
                    // eslint-disable-next-line no-unused-vars
                    var _id = this.model._id;
                    //this.jsplumb.instance.revalidate($(`#${_id}`));
                });
            },
            /*'model.connections':{
                immediate:true,
                deep:true,
                // eslint-disable-next-line no-unused-vars
                handler(newValue,oldValue){
                    //console.log('model.connections',newValue,oldValue);
                    setTimeout(()=>{
                        _.each(this.connections,(jcon)=>{
                            this.jsplumb.instance.detach(jcon);
                        });
                        this.connections = [];
                        _.each(newValue,async (connection)=>{
                            await this.$root.waitElements([
                                `#${this.model._id}.jtk-droppable`,
                                `#${connection.to}.jtk-droppable`
                            ]);
                            let jcon = this.jsplumb.instance.connect({source:this.model._id, target:connection.to,type:"basic"},{
                                from:this.model._id,
                                to:connection.to,
                                id:uniqueId('uniqueId')
                            });
                            console.log({jcon});
                            if(jcon&&connection.label)
                                jcon.getOverlay("label").setLabel(connection.label);
                            $(`#${this.model._id}.aLabel`).css('font-size',`${this.fontSize}%`);
                            this.connections.push(jcon);
                        });
                    },15000);

                }
            }*/
        },

        mounted: function () {
            this.$nextTick(()=>{
                this.ready = true;
                var _id = this.model._id;
                this.jsplumb.initNode( $(`#${_id}`),(change)=>{
                    try {
                        if (isset(change.left)) {
                            change.left = Math.round(change.left / this.scale);
                        }
                        if (isset(change.top)) {
                            change.top = Math.round(change.top / this.scale);
                        }
                    }catch (e) {
                        console.error(e);
                    }
                    change._id = _id;
                    this.$emit('changed',change);
                });
            })
        },

        methods:{
            onselect(){
                this.$emit('select',this.model);
            }
        }
    }
</script>

<style scoped>

</style>