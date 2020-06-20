<template>
    <modal name="ConfirmDialog">
        {{message}}

        <button type="button" class="btn btn-danger" v-on:click="onConfirm">Удалить</button>
        <button type="button" class="btn btn-success" v-on:click="onCancel">Отмена</button>


    </modal>
</template>

<script>
    export default {
        props:{
            message:{
                type:String
            }
        },
        methods:{
            onConfirm(){
                this.$emit('confirm');
            },
            onCancel(){
                this.$emit('cancel');
            }
        }
    }
</script>