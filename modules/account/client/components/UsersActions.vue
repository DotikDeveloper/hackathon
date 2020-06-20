<template>
    <div>
        <button class="login_button" title="Войти"
                v-if="$me&&model&&($me._id!=model._id)"
                v-on:click="clickLoginAs"
        ></button>
    </div>
</template>

<script>
    export default {
        name:'UsersActions',
        props:{
            model:{type:Object}
        },

        methods:{
            async clickLoginAs(){
                let success = await this.loginAsConfirm();
                if(success)
                    await this.loginAs(this.model._id);
            },

            loginAsConfirm(){
                return new Promise(resolve=>{
                    this.$modal.show('dialog', {
                        title: 'Войти?',
                        text: `Вы действительно желаете войти в субаккаунт "${this.model.name}" ?`,
                        buttons: [
                            {
                                title: 'Войти',
                                class:"btn btn-danger",
                                handler: () => {
                                    this.$modal.hide('dialog');
                                    resolve(true);
                                }
                            },
                            {
                                title: 'Отменить',       // Button title
                                default: true,    // Will be triggered by default if 'Enter' pressed.
                                class:"btn btn-success",
                                handler: () => {
                                    this.$modal.hide('dialog');
                                    resolve(false);
                                }
                            }
                        ]
                    })
                });
            },
        }
    }
</script>

<style>
    .login_button{
        background-image: url(/login_button.jpg);
        width: 24px;
        height: 24px;
        background-size:contain;
    }
</style>