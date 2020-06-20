<template>
    <div id="app" v-bind:class="{ fullscreen: $fullScreen }">
        <template v-if="$apolloLoading">
            <vue-loading/>
        </template>
        <template v-else>

            <div id="nav" style="">
                <!--
                <router-link to="/">Home</router-link>
                |
                <router-link to="/test">Тест</router-link>
                |
                <router-link to="/calendar">Календарь</router-link>
                |
                <router-link to="/schedule">Расписание</router-link>
                |
                <router-link to="/daysPicker">Календарь на год</router-link>
                |
                <template v-if="!$me">
                    <router-link :to="{name:'login'}">Вход</router-link>
                    |
                    <router-link :to="{name:'register'}">Регистрация</router-link>
                    |
                </template>

                <template v-if="$me">
                    <router-link :to="{name:'menuItemTemplatesIndex'}">Шаблоны меню</router-link>
                    |
                    <router-link :to="{name:'ivrEditor'}">Конструктор меню</router-link>
                    |
                    <router-link :to="{name:'ivrMenusIndex'}">Голосовые меню</router-link>
                    |
                    <router-link :to="{name:'serversIndex'}">Серверы</router-link>
                    |
                </template>
                <router-link to="/notFound">404</router-link>
                -->
            </div>


            <div id="breadcrumbs">
                <bread-crumb :key="viewKey"/>
            </div>

            <div id="flash-messages">
                <flash-message class="myCustomClass"></flash-message>
            </div>

            <div id="content" v-bind:class="{ fullscreen: $fullScreen }">
                <div id="left-nav">
                    <tree :key="leftNavData.key" :data="leftNavData.treeData" :options="leftNavData.treeOptions"
                          :filter="leftNavData.treeFilter" v-model="selectedNode">
                        <div class="left-nav-node" slot-scope="{ node }">
                            <template v-if="node.data.disabled">
                                <span style="color:#dddddd;">{{node.text}}</span>
                            </template>
                            <template v-else>
                                <template v-if="!!node.data.to">
                                    <router-link
                                            :disabled="node.data.disabled===true"
                                            :to="node.data.to"
                                    >{{ node.text }}
                                    </router-link>
                                </template>
                                <template v-else>
                                    <span>{{node.text}}</span>
                                </template>
                            </template>
                        </div>
                    </tree>
                </div>
                <div id="routercontent">
                    <v-dialog/>
                    <router-view :key="viewKey"/>
                </div>
            </div>
        </template>


    </div>
</template>

<style>
    #content {
        min-height: 100%;
    }

    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: #2c3e50;
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        height: 100vh;
        display: grid;
        grid-template-rows: min-content min-content min-content auto;
    }

    #app.fullscreen {
        grid-template-rows: auto;
    }

    #nav {
        padding: 30px;
        text-align: center;
    }

    #nav a {
        font-weight: bold;
        color: #2c3e50;
    }

    .left-nav-node a {
        font-weight: bold;
        color: #2c3e50;
    }

    .left-nav-node a.router-link-exact-active {
        color: #42b983;
    }

    #nav a.router-link-exact-active {
        color: #42b983;
    }

    #content {
        display: grid;
        grid-template-columns: min-content auto;
    }

    #content.fullscreen {
        grid-template-columns: auto;
    }
</style>

<script>
    import gql from 'graphql-tag';
    import BreadCrumb from "./components/BreadCrumb";
    import _ from 'underscore';
    import {uniqueId} from 'lodash';
    import {get as safeGet} from 'lodash';

    export default {
        components: {BreadCrumb},
        data () {
            return {
                selectedNode: null,
                treeData:null
            }
        },
        async beforeCreate() {
            window.app = this;
        },
        mounted () {
            this.$on('navTreeChanged',async ()=>{
                const response = await this.apolloQuery({
                    query: gql`query NavTree{
                        navItems{
                            treeData
                        }
                    }`
                });
                this.treeData = response.data.navItems.treeData;
                console.log({treeData:this.treeData});
                this.$recompute('leftNavData');
            });
            this.observeMe();
        },

        recomputed: {
            leftNavData () {
                return {
                    key: String (uniqueId ()),
                    selectedNode: null,
                    treeFilter: '',
                    treeOptions: {
                        multiple: false,
                        filter: {
                            plainList: true
                        }
                    },
                    treeData:this.treeData||this.$options.parent.treeData,
                };
            },

            viewKey () {
                return [
                    safeGet (this.$me, '_id', '-'),
                    this.$route.fullPath
                ].join (':');
            }
        },


    }
</script>