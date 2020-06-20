<template>
    <b-row class="justify-content-md-center">
        <b-col cols="6">
            <h2>Please Register</h2>
            <div v-if="errors && errors.length">
                <div v-bind:key="error"  v-for="error of errors">
                    <b-alert show>{{error.message}}</b-alert>
                </div>
            </div>
            <b-form @submit="onSubmit">
                <b-form-group
                              horizontal
                              :label-cols="4"
                              breakpoint="md"
                              label="Логин">
                    <b-form-input id="login" v-model.trim="register.login"></b-form-input>
                </b-form-group>
                <b-form-group
                              horizontal
                              :label-cols="4"
                              breakpoint="md"
                              label="Пароль">
                    <b-form-input type="password" id="password" v-model.trim="register.password"></b-form-input>
                </b-form-group>
                <b-button type="submit" variant="primary">Register</b-button>
                <b-button type="button" variant="success" @click="$router.go(-1)">Cancel</b-button>
            </b-form>
        </b-col>
    </b-row>
</template>

<script>

    import axios from 'axios'

    export default {
        name: 'Register',
        data () {
            return {
                register: {},
                errors: []
            }
        },
        methods: {
            onSubmit (evt) {
                evt.preventDefault();
                const url = this.buildUrl('api/auth/register/');
                axios.post(url, this.register)
                    // eslint-disable-next-line no-unused-vars
                    .then(response => {
                        alert("Registered successfully")
                        this.$router.push({
                            name: 'Login'
                        })
                    })
                    .catch(e => {
                        console.log(e)
                        this.errors.push(e)
                    })
            },
        }
    }
</script>