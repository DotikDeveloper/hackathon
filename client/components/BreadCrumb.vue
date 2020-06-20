<template>
    <v-breadcrumbs :items="crumbs">
        <template v-slot:divider>
            <span class="material-icons">chevron_right</span>
        </template>
    </v-breadcrumbs>
</template>

<script>
    import {get as safeGet} from 'lodash';
    import _ from 'underscore';
    import {EventEmitter} from "events";


    class BreadCrumbHelper extends EventEmitter{

        constructor(component,breadCrumbs,$route=null){
            super();
            this.component = component;
            this.breadCrumbs=breadCrumbs;
            this.$route = $route||component.$route;
        }

        init(){
            let result = [];

            this.component.$once('routeChanged',()=>{
                this.stop();
            });

            return this.load().then(async ()=>{
                let name = this.breadCrumbs.name || this.$route.name;
                let keys=['params'];
                let routerData = {name:name};
                _.each(keys,(key)=>{
                    let getter = this.breadCrumbs[key];
                    if(getter){
                        let value = _.isFunction(getter)?getter.call(this.component):getter;
                        routerData[key] = value;
                    }else{
                        let value = this.$route[key];
                        routerData[key] = value;
                    }
                });

                let label = this.breadCrumbs.label;
                try {
                    label = await ( _.isFunction(label)?label.call(this.component):label );
                    result.push({
                        disabled: false,
                        to:routerData,
                        text:label,
                        exact:true
                    });
                    // eslint-disable-next-line no-empty
                }catch (e){

                }

                if(this.breadCrumbs.parent){
                    let resolved = this.component.$router.resolve({name:this.breadCrumbs.parent });
                    let breadCrumbs = safeGet(resolved,'route.meta.breadcrumbs',null);
                    if(breadCrumbs){
                        if( _.isFunction(breadCrumbs)){
                            breadCrumbs = breadCrumbs.call(this.component)
                        }
                        if(!_.isArray(breadCrumbs))
                            breadCrumbs=[breadCrumbs];
                        return Promise.all(_.map(breadCrumbs,(breadCrumb)=>{
                            let helper = new BreadCrumbHelper(this.component,breadCrumb,resolved.route);
                            return helper.init();
                        })).then((parentResult)=>{
                            _.chain(parentResult)
                                .flatten()
                                .compact()
                                .each((crumb)=>{
                                    result.push(crumb)
                                });
                            return result;
                        });
                    }
                }
                return(result);

            });
        }

        load(){
            return new Promise((resolve)=>{
                if(!this.component.$apollo || !this.component.$apolloLoading)
                    return resolve();
                let unwatch = this.component.$watch('$apolloLoading',function(newValue){
                    if(!newValue){
                        unwatch();
                        resolve();
                    }
                },{ immediate:true,deep:true });
                this.once('stop',()=>{
                    unwatch();
                });
            });
        }

        stop(){
            this.emit('stop');
        }


    }


    export default {
        name:'BreadCrumb',
        watch:{
            $route:{
                immediate: true,
                deep:true,
                handler(){
                    this.$emit('routeChanged');
                    this.$nextTick(()=>{
                        let componentInstance = safeGet(this.$route,'matched[0].instances.default',this);
                        let $route = this.$route;

                        (async function(){
                            const titleFactory = $route&&$route.meta?$route.meta.title:undefined;
                            let pageTitle = await ( _.isFunction(titleFactory)
                                ? titleFactory.apply(componentInstance, [componentInstance])
                                : titleFactory );
                            if(typeof pageTitle=='undefined')
                                pageTitle = '';
                            document.title = [
                                'Хакатон',
                                String( pageTitle )
                            ].join(' | ')
                        }).apply(this);



                        let breadCrumbs = safeGet($route,'meta.breadcrumbs',null);
                        if(!breadCrumbs){
                            this.crumbs = [];
                            return;
                        }

                        if( _.isFunction(breadCrumbs)){
                            breadCrumbs = breadCrumbs.call(componentInstance)
                        }
                        if(!_.isArray(breadCrumbs))
                            breadCrumbs=[breadCrumbs];

                        let changed = false;
                        this.$once('routeChanged',()=>{
                            changed=true;
                        });

                        Promise.all(_.map(breadCrumbs,(breadCrumb)=>{
                            let helper = new BreadCrumbHelper(componentInstance,breadCrumb);
                            return helper.init();
                        })).then((result)=>{
                            if(!changed) {
                                let crumbs = _.chain(result)
                                    .flatten()
                                    .reverse()
                                    .compact()
                                    .value();
                                this.crumbs = crumbs;
                            }
                        });
                    });
                }
            }
        },
        data(){
            return {
                crumbs:[],
            }
        },
    };
</script>