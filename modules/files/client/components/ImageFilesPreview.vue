<template>
    <div style="margin-bottom: 50px;">
        <img v-if="fileIcon()" :src="fileIcon()"/>
        <span>{{model.versions.original.name}}</span>
    </div>
</template>
<script>
    export default {
        props:['model'],
        data(){
            return {

            }
        },
        methods: {
            fileIcon () {
                return this.model.urls.small;
            }
        }
    }
</script>