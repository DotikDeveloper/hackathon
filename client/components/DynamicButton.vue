<template>
    <button class="cssClass" title="title" v-on:click="onClick">
        {{label}}
    </button>
</template>

<script>
    import _ from 'underscore';
    export default {
        props:{
            cssClass:{
                type:String,
                default:''
            },
            title:{
                type:String,
                default:''
            },
            label:{
                type:String,
                default:''
            },
            click:{
                default:null
            }
        },

        methods:{
            onClick(){
                if(_.isFunction(this.click)){
                    this.click.apply(this);
                }
            }
        }
    }
</script>