<template>
    <div style="margin-bottom: 50px;">
        <img v-if="fileIcon()" :src="fileIcon()"/>
        <span>{{model.versions.original.name}}</span>
    </div>
</template>
<script>
    import {get as safeGet} from 'lodash';

    export default {
        props:['model'],
        data(){
            return {

            }
        },
        methods: {
            fileIcon () {
                let name = safeGet (this.model, 'versions.original.name', '');
                let ext = name.split('.').pop();
                if (ext) {
                    ext = ext.toLowerCase();
                }
                if (ext)
                    return `https://raw.githubusercontent.com/eagerterrier/MimeTypes-Link-Icons/master/images/${ext}-icon-48x48.gif`;
                return '';
            }
        }
    }
</script>