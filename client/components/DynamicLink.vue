<template>
    <router-link v-if="!isAbsoluteUrl()&&to&&!disabled" :to="to">
        <img :src="img" v-if="img"/>
        {{anchor}}
    </router-link>
    <a :href="to" v-else-if="isAbsoluteUrl()&&!disabled">{{anchor}}</a>
    <a class="btn disabled" disabled v-else>{{anchor}}</a>
</template>
<script>
    import _ from 'underscore';

    export default {
        props: {
            to: {},
            anchor: {},
            img: {},
            disabled: {
                type: Boolean,
                default: false
            }
        },
        methods: {
            isAbsoluteUrl () {
                return _.isString (this.to);
            }
        }
    }
</script>

<style>
    .link-disabled{

    }
</style>