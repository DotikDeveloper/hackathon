import Vue from 'vue';
import _ from 'underscore';

Vue.mixin({
    data(){
        return {
            apolloComponentCreated:false,
            apolloManualLoadingCounter:0
        }
    },

    methods:{
        async apolloLoaded(){
            await this.waitCreated();
            if(this.$apollo&&!this.$apolloLoading)
                return;

            return new Promise((resolve => {
                let unwatch = this.$watch("$apolloLoading", (newValue)=>{
                    if(newValue===false){
                        unwatch();
                        this.$nextTick(resolve);
                    }
                }, { deep: true,immediate:true });
            }));

        },

        waitCreated(){
            if(this.apolloComponentCreated)
                return Promise.resolve();
            return new Promise(resolve=>{
                this.$once('apolloComponentCreated',resolve);
            });
        },

        async apolloQuery($query){
            let afterLoad = ()=>{};
            if($query.markLoading!==false)
                afterLoad = this.markLoading();

            if (_.isFunction ($query.variables)) {
                let variables = $query.variables.apply(this);
                $query = _.clone($query);
                $query.variables = variables;
            }
            try {
                let response = await this.$apollo.query ($query);
                return response;
            }catch (e) {
                throw e;
            }finally {
                afterLoad();
            }
        },

        markLoading(){
            this.apolloManualLoadingCounter++;
            return ()=>{
                this.apolloManualLoadingCounter--;
            };
        }

    },

    computed:{
        $apolloLoading(){
            return this.$apollo.loading || this.apolloManualLoadingCounter > 0;
        }
    },

    created () {
        this.$nextTick(()=>{
            this.apolloComponentCreated = true;
            this.$emit('apolloComponentCreated');
        });
    }

});