<template>
    <b-row class="justify-content-md-center">
        <b-col cols="6">
            <div v-if="errors && errors.length">
                <div v-bind:key="error" v-for="error of errors">
                    <b-alert show>{{error.message}}</b-alert>
                </div>
            </div>
            <b-form @submit="onSubmit">
                <b-form-group
                        horizontal
                        :label-cols="4"
                        breakpoint="md"
                        label="Логин">
                    <b-form-input id="login" v-model.trim="login.login"></b-form-input>
                </b-form-group>
                <b-form-group horizontal
                              :label-cols="4"
                              breakpoint="md"
                              label="Пароль">
                    <b-form-input type="password" id="password" v-model.trim="login.password"></b-form-input>
                </b-form-group>
                <div class="form-group container text-center" style="width: 100%;">
                        <b-button type="submit" variant="primary">Вход</b-button>
                        <b-button type="button" variant="success" @click.stop="register()">Регистрация</b-button>
                </div>
                <div class="form-group">
                    <div class="mx-auto container border rounded row text-center pagination-centered" style="width:200px;margin-top:50px;">
                        <span class="medium text-center" style="width:100%;">Войти с помощью</span>
                        <a class="mx-auto" href="#" v-on:click="doVkLogin" title="Вконтакте">
                            <img :src="buildUrl('/vk-logo.png')" style="height:50px;width:auto"/>
                        </a>
                    </div>
                </div>
            </b-form>

        </b-col>
    </b-row>
</template>

<script>

    import axios from 'axios'
    import Cookie from 'js-cookie';

    export default {
        name: 'Login',
        data () {
            return {
                login: {},
                errors: []
            }
        },
        methods: {
            doVkLogin () {
                window.location = this.buildUrl ('auth/vk');
            },
            onSubmit (evt) {
                evt.preventDefault ()
                const url = this.buildUrl ('api/auth/login/');
                axios.post (url, this.login)
                .then (response => {
                    localStorage.setItem ('jwtToken', response.data.token);

                    Cookie.set ('jwtToken', response.data.token);
                    this.$router.push ({
                        name: 'home'
                    });
                    window.app.observeMe();
                })
                .catch (e => {
                    console.log (e)
                    this.errors.push (e)
                })
            },
            register () {
                this.$router.push ({
                    name: 'Register'
                })
            }
        }
    }
</script>