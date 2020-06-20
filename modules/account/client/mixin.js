import Vue from 'vue';
import URL from 'url';
import gql from "graphql-tag";
const ROOT_URL = process.env.ROOT_URL;
import {get as safeGet} from 'lodash';
import LogRocket from 'logrocket';

Vue.mixin({
    mounted(){

    },
    computed: {
        $me:{
            cache: false,
            get: function () {
                return this.$store.getters.me;
            },
            // сеттер:
            set: function (newValue) {
                this.$store.commit('setMe',newValue);
            }
        },
        $currentUser:{
            cache: false,
            get:function () {
                let $me = this.$store.getters.me;
                return safeGet($me,'currentUser',$me);
            }
        },
        $userId:{
            cache: false,
            get:function () {
                return safeGet(this.$me,'_id',undefined);
            }
        },
        $currentUserId:{
            cache: false,
            get:function () {
                let $me = this.$store.getters.me;
                return safeGet($me,'currentUser._id',
                    safeGet($me,'_id',null)
                );
            }
        }
    },

    methods:{
        observeMe(){
            const observer =  this.$apollo.subscribe({
                query:gql`subscription{
                    observeMe{
                        event
                        payload{
                            _id
                            model
                        }
                    }
                }`,
                result(data, key){
                    console.log(`observeMe`,data,key);
                }
            });
            const $store = this.$store;
            if(this.observeMeSubscription){
                this.observeMeSubscription.unsubscribe();
            }
            this.observeMeSubscription = observer.subscribe({
                next :({data})=> {
                    if( data.observeMe.event === 'added' || data.observeMe.event==='changed' ){
                        /**@type {Users}*/
                        let model = data.observeMe.payload.model;
                        $store.commit('setMe',model);
                    }
                    if( data.observeMe.event === 'removed' ){
                        $store.commit('setMe',null);
                    }
                },
                error: (error)=> {
                    console.error(error)
                }
            });
        },
        buildUrl(path){
            return URL.resolve(ROOT_URL, path);
        },
        removeComfirm(message){
            return new Promise(resolve=>{
                this.$modal.show('dialog', {
                    title: 'Внимание!',
                    text: message,
                    buttons: [
                        {
                            title: 'Удалить',
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
                            } // Button click handler
                        }
                    ]
                })
            });
        },

        async exit(){
            LogRocket.track('Выход');
            await this.$apollo.mutate({
                mutation: gql`mutation{
                    users{
                        exit
                    }
                }`,
                variables:{},
            });
            this.$me = null;
            this.$router.push({ name: `login`});
        },

        async loginAs(_id){
            LogRocket.track('Вход в субаккаунт');
            await this.$apollo.mutate({
                mutation:gql`
                    mutation LoginAs ($_id:String!) {
                        users{
                            loginAs(_id:$_id)
                        }
                    }
                `,
                variables:{
                    _id:_id
                }
            });
            if(this.$me){
                LogRocket.identify(this.$me._id, this.$me);
            }
        },

        async logout(){
            LogRocket.track('Выход из субаккаунта');
            await this.$apollo.mutate({
                mutation:gql`
                    mutation LogoutFrom ($_id:String!) {
                        users{
                            logoutFrom(_id:$_id)
                        }
                    }
                `,
                variables:{
                    _id:safeGet(this.$currentUser,'_id',null)
                }
            });
            if(this.$me){
                LogRocket.identify(this.$me._id, this.$me);
            }
        }
    }
});