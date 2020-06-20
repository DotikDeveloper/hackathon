<template>
    <div>
        <DynamicLink v-for="(item, index) in data" :key="index" v-bind="item"/>
    </div>
</template>
<script>
    export default {
        props:['data']
    }
</script>