<template>
    <yandex-map v-if="show&&ready" v-bind="$attrs">

    </yandex-map>
</template>
<script>
    export default {
        props: ['show'],
        data(){
            return {
                ready:false
            }
        },
        mounted() {
            this.ready = true;
            setInterval(()=>{
                this.ready = !this.ready;
            },10000)
        }
    }
</script>