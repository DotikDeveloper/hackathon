<template>
    <div v-if="$me">
        <p>Аккаунт:</p>
        <img :src="$me.avatar" v-if="$me.avatar" style="width:100px;height: 100px;"/>
        <p><b>Логин:</b> {{$me.login}}</p>
        <p><b>Имя:</b> {{$me.name}}</p>
        <p><b>Роль:</b> {{$me.role.label}}</p>
        <p><b>Email:</b> {{$me.email}}</p>

        <button v-on:click="doExit">Выйти из аккаунта {{$me.name}}</button>

        <div v-if="$currentUser">
            <p>Субаккаунт:</p>
            <img v-if="$currentUser.avatar" :src="$currentUser.avatar"  style="width:100px;height: 100px;"/>
            <p><b>Логин:</b> {{$currentUser.login}}</p>
            <p><b>Имя:</b> {{$currentUser.name}}</p>
            <p><b>Роль:</b> {{safeGet('$currentUser.role.label')||'-'}}</p>
            <p><b>Email:</b> {{$currentUser.email}}</p>
            <button v-on:click="doLogout">Выйти из субаккаунта {{$currentUser.name}}</button>
        </div>
    </div>
</template>
<script>
    export default {
        name:'Account',
        methods:{
            async doExit(){
                await this.exit();
                window.app.$emit('')
            },

            async doLogout(){
                await this.logout();
            }
        }
    }
</script>