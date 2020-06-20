<template>
    <div v-if="ready" style="height:100%;">

        <modal name="errorsDialog">
            <div style="z-index: 99999;">
                <div>Ошибки:</div>
                <p v-for="error in errors" :key="error.message">
                    {{error.message}}
                </p>
            </div>
        </modal>

        <modal name="afterSaveDialog"
            @closed="$router.push({ name: `menusIndex`})"
        >
            <span class="text-success" style="z-index: 99999;">
                Изменения сохранены
            </span>
        </modal>

        <div class="menu-editor" id="menuEditor" style="height:100%;">
            <div style="height:100%;">
                <Split style="height:100%;">
                    <SplitArea :size="70">
                        <div id="canvasWrapper"
                             style="width:100%;background-color: lightcyan;height:100%;float: left;overflow: auto;">
                            <div class="controls" style="position: relative;margin-top:5px;float: right;">
                                <span class="material-icons control" title="Увеличить" v-on:click="incrementScale">zoom_in</span>
                                <span class="material-icons control" title="Уменьшить" v-on:click="decrementScale">zoom_out</span>
                                <span class="material-icons control" title="Сохранить"
                                      v-on:click="doSave">save</span>

                                <span v-if="$fullScreen"
                                      class="material-icons control" title="Выйти из режима полного экрана"
                                      v-on:click="disableFullScreen">fullscreen_exit</span>
                                <span v-else
                                      class="material-icons control" title="Режим полного экрана"
                                      v-on:click="enableFullScreen">fullscreen</span>

                                <div class="control-grid">

                                    <div class="cell"></div>
                                    <span class="material-icons control" title="Вверх"
                                          v-on:click="shiftCoords(0,50)">arrow_upward</span>
                                    <div class="cell"></div>

                                    <span class="material-icons control" title="Влево"
                                          v-on:click="shiftCoords(50,0)">arrow_back</span>
                                    <div class="cell"></div>
                                    <span class="material-icons control" title="Вправо"
                                          v-on:click="shiftCoords(-50,0)">arrow_forward</span>

                                    <div class="cell"></div>
                                    <span class="material-icons control" title="Вниз"
                                          v-on:click="shiftCoords(0,-50)">arrow_downward</span>
                                    <div class="cell"></div>

                                </div>
                                <button @click="variables">Variables</button>

                            </div>
                            <div class="jtk-demo-canvas canvas-wide statemachine-demo jtk-surface jtk-surface-nopan grid"
                                 id="canvas"
                                 style="z-index:999;width:100%;height:auto;display: flex;position: relative;">

                                <MenuItemView v-on:changed="onMenuItemChanged($event)"
                                              v-on:select="onMenuItemsSelected($event)"
                                              v-for="(menuItem) in menu.menuItems"
                                              :key="menuItem._id" v-bind:model="menuItem"
                                              v-bind:jsplumb="jsplumb"
                                              v-bind:scale="scale"
                                              v-on:deleteItem="doDeleteItem($event)"
                                ></MenuItemView>


                            </div>
                        </div>
                    </SplitArea>
                    <SplitArea :size="28">
                        <div id="blocks" style="margin-top:1em;margin-left:1em;width:100%;">
                            <div v-for="block in menu.menuType.menuBlocks" :key="block._id"
                                 style="position: relative;width:50px;height:50px;float:left;">
                                <div :block_id="block._id" :key="block._id" class="blockButton"
                                     style="z-index:9999;position: absolute;display: inline-block;width:50px;height:50px;">
                                    <img :src="block.imageFile?block.imageFile.urls.small:''" :title="block.name"/>
                                </div>
                            </div>
                        </div>
                        <div id="palette" style="float: left;width:100%;">
                            <div v-if="isSelectedModel" style="margin-top:1em;margin-left:1em;width:100%;">
                                Выбрано:<b>{{selectedModel.label}}</b>

                                <menuItemForm v-on:submit="onMenuItemFormSubmit($event)"
                                              v-on:cancel="onMenuItemFormCancel($event)"
                                              v-on:change="onMenuItemFormChanged()"
                                              v-bind:model="selectedModel"
                                              v-bind:menuType="menu.menuType"
                                ></menuItemForm>
                            </div>
                            <div v-if="isSelectedConnection">
                                <connection-form v-on:submit="onConnectionSubmit($event)"
                                                 v-on:cancel="onConnectionCancel($event)"
                                                 v-on:delete="onConnectionDelete($event)"
                                                 v-on:change="onConnectionChanged()"
                                                 v-bind:model="selectedConnection"
                                                 v-bind:menuEditor="menuEditor"
                                ></connection-form>
                            </div>
                        </div>

                    </SplitArea>
                </Split>
            </div>
        </div>
        <div class="container">

        </div>
    </div>
    <vue-loading v-else/>
</template>

<script>
    import PlumbWrapper from "/client/components/jsplumb/PlumbWrapper";
    import $ from 'jquery';
    import MenuItemView from "./MenuItemView";
    import _ from 'underscore';
    import Vue from 'vue';
    import MenuItemForm from './MenuItemForm';
    import ConnectionForm from "./ConnectionForm";
    import gql from 'graphql-tag';
    import IRLibLoader from "/lib/IRLibLoader";
    import {uniqueId, get as safeGet} from 'lodash';
    import CustomQueryFilter from "/lib/CustomQueryFilter";
    import {FILTER_MODE} from "../../../../lib/enums";
    import {graphqlClone, mongooseObjectId} from "../../../../lib/utils";

    const menuItemsFragment = `
	_id
	menu_id
	user_id
	top
	left
	index
	block_id
	label
	data
    menu{_id name}
    user{_id name}
    connections
    menuBlock{
        _id name addSystemButtons
        imageFile{
            urls
        }
    }
    acl
`;
    const menuTypesFragment = `
    _id
	name
	image_file_id
	user_id
	ctxClassExpr
	supertype
    user{_id name}
    imageFile{_id urls }
    menuBlocks{
        _id name addSystemButtons imageFile{urls}
    }
    acl
    `;

    export default {
        name: "MenuEditor",

        apollo: {
            menu: {
                query: gql`
                    query MenuView($_id:String!){
                        menus{
                            view(_id:$_id){
                                _id
                                name
                                user_id
                                ctxClassExpr
                                menu_type_id
                                menuType{
                                    ${menuTypesFragment}
                                }
                                menuItems{
                                    ${menuItemsFragment}
                                }
                            }
                        }
                    }`,
                variables () {
                    return {_id: this.$route.params._id}
                },
                update (data) {
                    return this.menu = data?.menus?.view
                }
            }
        },

        async created () {
            window['FILTER_MODE'] = FILTER_MODE;
            await IRLibLoader.getInstance ().load (`/menuTypeSchema.js?hash=${uniqueId ()}`);
            this.libLoaded = true;
        },

        data () {
            return {
                errors:[],
                jsplumb: null,
                menu: null,
                scale: 1,
                selectedModel: null,
                selectedModelChanged: false,

                selectedConnection: null,
                selectedJcon: null,
                libLoaded: false,
                menuEditor: this
            };
        },
        computed: {
            isSelectedConnection () {
                return !!this.selectedConnection;
            },
            isSelectedModel () {
                return !!this.selectedModel;
            },

            ready () {
                return !!this.jsplumb && this.libLoaded && !this.$apollo.loading;
            }
        },
        mounted: async function () {
            await this.apolloLoaded();

            this.$nextTick (() => {
                const jsplumb = new PlumbWrapper ();
                jsplumb.once ('ready', async () => {
                    this.jsplumb = jsplumb;

                    await _.mapAsync(this.menu.menuItems,/**@param {MenuItems} menuItem*/async (menuItem)=>{
                        await _.mapAsync(menuItem.connections,async (connection)=>{
                            await this.$root.waitElements([
                                `#${menuItem._id}.jtk-droppable`,
                                `#${connection.to}.jtk-droppable`
                            ]);
                            let jcon = jsplumb.instance.connect({source:menuItem._id, target:connection.to,type:"basic"});
                            console.log({jcon});
                            if(jcon&&connection.label)
                                jcon.getOverlay("label").setLabel(connection.label);
                            jcon.setData({connection:connection});
                            let fontSize=()=>{
                                let fontSize = Math.round(100*this.scale);
                                if(fontSize<60)
                                    fontSize=60;
                                return fontSize;
                            };
                            $(`#${menuItem._id}.aLabel`).css('font-size',`${fontSize()}%`);
                        });
                    });

                    jsplumb.on('connection',(info)=>{
                        const jcon = info.connection;
                        let $source = $(info.source);
                        let $target = $(info.target);
                        let source_item_id = $source.attr('id');
                        let sourceMenuItem = _.find(this.menu.menuItems,(menuItem)=>{
                            return menuItem._id === source_item_id;
                        });
                        if(sourceMenuItem){
                            let connection = {
                                _id: mongooseObjectId(),
                                to: $target.attr('id'),
                                priority:0,
                                rules:{
                                    condition:'AND',
                                    rules:[],
                                    valid:true
                                }
                            };
                            sourceMenuItem.connections.push(connection);
                            jcon.setData({connection});
                        }
                    });
                });
                jsplumb.on ('selectConnection', (jcon) => {
                    let connection = jcon.getData().connection;
                    this.selectedConnection = connection;
                    this.selectedModel = null;
                    this.selectedJcon = jcon;
                });




            });

            this.$nextTick (() => {
                setTimeout (() => {
                    $.fn.attachDragger = function () {
                        let attachment = false, lastPosition, position, difference;
                        $ ($ (this).selector).on ("mousedown mouseup mousemove", function (e) {
                            if (e.type == "mousedown") attachment = true, lastPosition = [e.clientX, e.clientY];
                            if (e.type == "mouseup") attachment = false;
                            if (e.type == "mousemove" && attachment == true) {
                                console.log ('canvas mousemove');
                                position = [e.clientX, e.clientY];
                                difference = [(position[0] - lastPosition[0]), (position[1] - lastPosition[1])];
                                $ (this).scrollLeft ($ (this).scrollLeft () - difference[0]);
                                $ (this).scrollTop ($ (this).scrollTop () - difference[1]);
                                lastPosition = [e.clientX, e.clientY];
                            }
                        });
                        $ (window).on ("mouseup", function () {
                            attachment = false;
                        });
                    };
                    $ ('#canvasWrapper').attachDragger ();
                }, 1000);
            });
        },

        updated () {
            $ ('.blockButton').draggable ({
                revert: true,
                cursor: 'pointer',
                revertDuration: 0,
                containment: "document",
                stop: (event, ui) => {
                    /**@type {Menus}*/
                    let menu = this.menu;

                    const block_id = $ (event.target).attr ('block_id');
                    const menuBlock = _.find (menu.menuType.menuBlocks, (menuBlock) => {
                        return menuBlock._id === block_id;
                    });


                    /**@type {MenuItems}*/
                    let menuItem = {
                        _id: mongooseObjectId (),
                        menu_id: menu._id,
                        user_id: menu.user_id,
                        top: Math.round ((ui.offset.top) - $ ('#menuEditor').offset ().top),
                        left: Math.round (ui.offset.left - $ ('#menuEditor').offset ().left),
                        index: '',
                        block_id: block_id,

                        label: menuBlock.name,
                        data: {},
                        menuBlock: menuBlock,
                        connections: []
                    };
                    menu.menuItems.push (menuItem);
                    this.menu = graphqlClone (menu);
                    console.log (menu.menuItems);
                }
            });
        },

        methods: {
            async doSave () {
                try {
                    let validateResult = await this.apolloQuery ({
                        query: gql`
                            query MenuEditorValidate($model:JSONObject!){
                                menus{
                                    editorValidate(model: $model){
                                        errors{
                                            message
                                            type
                                            path
                                            value
                                            field
                                        }
                                    }
                                }
                            }
                    `,
                        variables(){
                            return {
                                model:graphqlClone(this.menu)
                            }
                        }
                    });
                    let errors = validateResult?.data?.menus?.editorValidate?.errors;
                    if(_.isArray(errors)){
                        if(!_.isEmpty(errors)){
                            this.errors = errors;
                            this.$modal.show('errorsDialog', {
                                errors:errors,
                                buttons: [
                                    {
                                        title: 'Закрыть'
                                    }
                                ]
                            });

                            return _.each(errors,(error)=>{
                                this.flash(String(error.message), 'error', {
                                    timeout: 15000
                                });
                            });
                        }

                        try {
                            let response = await this.$apollo.mutate({
                                mutation: gql`mutation MenuEditorEdit($_id:String! $model:JSONObject!){
                                menus{
                                    editorEdit(_id:$_id model:$model){
                                        success message errors _id
                                    }
                                }
                            }`,
                                variables:{
                                    _id:this.$route.params._id,
                                    model:graphqlClone(this.menu)
                                }
                            });
                            let success = response?.data?.menus?.editorEdit?.success;
                            if(success)
                                this.$modal.show('afterSaveDialog');
                        }catch (e) {
                            this.flash(String(e), 'error', {
                                timeout: 20000
                            });
                        }



                    }
                }catch (e) {
                    this.flash(String(e), 'error', {
                        timeout: 15000
                    });
                }
            },

            async variables () {
                let response = await this.apolloQuery({
                    query:gql`query MenuVariables($_id:String! $model:JSONObject!){
    menus{
        variables(_id: $_id model:$model)
    }
}`,
                    variables:{
                        _id:this.menu._id,
                        model:graphqlClone(this.menu)
                    },
                    markLoading:false
                });
                console.log({response});
            },

            async filters () {
                let response = await this.apolloQuery({
                    query:gql`query MenuVariables($_id:String! $model:JSONObject!){
    menus{
        variables(_id: $_id model:$model)
    }
}`,
                    variables:{
                        _id:this.menu._id,
                        model:graphqlClone(this.menu)
                    },
                    markLoading:false
                });
                let result = response.data.menus.variables.filters;
                console.log({'filters':result});
                return result;

            },
            onConnectionSubmit () {
                this.selectedConnection = null;
                this.selectedJcon = null;
            },
            onConnectionCancel ($oldModel) {
                let jcon = this.selectedJcon;
                if (jcon) {
                    jcon.setData({connection:$oldModel});
                    _.each (this.menu.menuItems, (menuItem) => {
                        _.each (menuItem.connections, (tmpConnection, index) => {
                            if (tmpConnection._id == $oldModel._id) {
                                menuItem.connections[index] = $oldModel;
                            }
                        });
                    });
                    this.selectedConnection = null;
                    this.selectedJcon = null;
                }
            },

            onConnectionDelete(){
                let jcon = this.selectedJcon;
                let connection = this.selectedConnection;
                if (jcon) {
                    _.each (this.menu.menuItems, (menuItem) => {
                        let storedConnection = _.find(menuItem.connections,(tmpConnection)=>{
                            return tmpConnection._id == connection._id;
                        });

                        if(storedConnection){
                            menuItem.connections = _.filter(menuItem.connections,(tmpConnection)=>{
                                return tmpConnection._id !== connection._id;
                            })
                        }
                    });
                    this.selectedConnection = null;
                    this.selectedJcon = null;
                }
                this.jsplumb.instance.detach(jcon);
            },

            onConnectionChanged () {

            },

            onMenuItemFormChanged () {
                this.selectedModelChanged = true;
            },
            onMenuItemFormCancel ($oldModel) {
                console.log ('onMenuItemFormCancel', $oldModel);
                _.each (this.menu.menuItems, (menuItem) => {
                    if (menuItem._id == $oldModel._id) {
                        _.extend (menuItem, $oldModel);
                    }
                });
                Vue.set(this.menu,'menuItems',this.menu.menuItems);
                this.selectedModel = null;
            },
            onMenuItemFormSubmit () {
                this.selectedModel = null;
            },
            onMenuItemChanged: function (changed) {
                const menuItem = _.find (this.menu.menuItems, (menuItem) => {
                    return menuItem._id === changed._id
                });
                if (menuItem) {
                    _.extend (menuItem, changed);
                    Vue.set(this.menu, 'menuItems', this.menu.menuItems);
                }
            },
            onMenuItemsSelected ($event) {
                if (this.selectedModel && this.selectedModel._id === $event._id)
                    return;
                if (this.selectedModel && this.selectedModelChanged) {
                    let selectedLabel = this.selectedModel.label ? `"${this.selectedModel.label}" ` : '';
                    if (!confirm (`Текущий редактируемый блок ${selectedLabel}будет закрыт`))
                        return;
                }
                let menuItemModel = _.find (this.menu.menuItems, (model) => {
                    return model._id === $event._id
                });
                this.selectedModelChanged = false;
                this.selectedConnection = null;
                this.selectedJcon=null;
                this.selectedModel = menuItemModel;
            },
            incrementScale () {
                this.scale += 0.1;
                this.$nextTick (() => {
                    this.jsplumb.instance.repaintEverything ();
                    this.jsplumb.hardRepaintLaiter ();
                });
                let fontSize = Math.round (100 * this.scale);
                if (fontSize < 60)
                    fontSize = 60;
                $ (this.$el).find ('.aLabel').css ('font-size', `${fontSize}%`);
            },
            decrementScale () {
                this.scale -= 0.1;
                this.$nextTick (() => {
                    this.jsplumb.instance.repaintEverything ();
                    this.jsplumb.hardRepaintLaiter ();
                });
                let fontSize = Math.round (100 * this.scale);
                if (fontSize < 60)
                    fontSize = 60;
                $ (this.$el).find ('.aLabel').css ('font-size', `${fontSize}%`);
            },
            doDeleteItem ($model) {
                this.menu.menuItems = _.filter(this.menu.menuItems,(menuItem)=>{
                    return menuItem._id !== $model._id;
                });
                this.jsplumb.instance.detachAllConnections ($model._id);
            },

            shiftCoords (x, y) {
                _.each (this.menu.menuItems, (menuItem) => {
                    menuItem.left += x;
                    menuItem.top += y;
                });
                Vue.set(this.menu,'menuItems',this.menu.menuItems);
                this.$nextTick (() => {
                    this.jsplumb.instance.repaintEverything ();
                    this.jsplumb.hardRepaintLaiter ();
                });
            }


        },

        components: {
            ConnectionForm,
            MenuItemView: MenuItemView,
            MenuItemForm: MenuItemForm
        }
    };


</script>

<style>
    .controls {
        z-index: 1000;
    }

    .control-grid {
        display: grid;
        grid-template-columns: min-content min-content min-content;
        grid-template-rows: min-content min-content min-content;
    }

    .menu-editor {
        border: 2px dotted rgb(81, 132, 160);
    }

    .control {
        display: inline-block;
        background-color: rgb(81, 132, 160);
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
        box-sizing: border-box;
        color: rgb(255, 255, 255);
        cursor: pointer;
        line-height: 14px;
        margin-right: 4px;
        padding-bottom: 4px;
        padding-top: 4px;
        text-rendering: optimizelegibility;
        user-select: none;
    }

    .noselect {
        -webkit-touch-callout: none; /* iOS Safari */
        -webkit-user-select: none; /* Safari */
        -khtml-user-select: none; /* Konqueror HTML */
        -moz-user-select: none; /* Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
        user-select: none;
        /* Non-prefixed version, currently
                                         supported by Chrome and Opera */
    }

    .demo {
        /* for IE10+ touch devices */
        touch-action: none;
    }

    .menuItem {
        position: absolute;
        z-index: 4;
        border: 1px solid #2e6f9a;
        box-shadow: 2px 2px 19px #e0e0e0;
        -o-box-shadow: 2px 2px 19px #e0e0e0;
        -webkit-box-shadow: 2px 2px 19px #e0e0e0;
        -moz-box-shadow: 2px 2px 19px #e0e0e0;
        -moz-border-radius: 8px;
        border-radius: 8px;
        opacity: 0.8;
        cursor: move;
        background-color: white;
        font-size: 11px;
        -webkit-transition: background-color 0.25s ease-in;
        -moz-transition: background-color 0.25s ease-in;
        transition: background-color 0.25s ease-in;
        user-select: none;
    }

    .menuItem:hover {
        background-color: #5c96bc;
        opacity: 1;
        /*color: white;*/
    }

    .aLabel {
        -webkit-transition: background-color 0.25s ease-in;
        -moz-transition: background-color 0.25s ease-in;
        transition: background-color 0.25s ease-in;
        background-color: white;
        opacity: 0.8;
        padding: 0.3em;
        border-radius: 0.5em;
        border: 1px solid #346789;
        cursor: pointer;
        /* transform: translate(- 50 %, - 50 %) !important;
         font-size: 8 px;*/
    }

    .aLabel.jtk-hover, .jtk-source-hover, .jtk-target-hover {
        background-color: #1e8151;
        color: white;
    }

    .ep {
        left: 0;
        margin: auto;
        position: relative;
        /* bottom: 37 %;*/
        right: 5px;
        width: 1em;
        height: 1em;
        background-color: orange;
        cursor: pointer;
        box-shadow: 0 0 2px black;
        -webkit-transition: -webkit-box-shadow 0.25s ease-in;
        -moz-transition: -moz-box-shadow 0.25s ease-in;
        transition: box-shadow 0.25s ease-in;
    }

    .ep:hover {
        box-shadow: 0 0 6px black;
    }

    .statemachine-demo .jtk-endpoint {
        z-index: 3;
    }



    #rejected {
        left: 10em;
        top: 35em;
    }

    .dragHover {
        border: 2px solid orange;
    }

    path, .jtk-endpoint {
        cursor: pointer;
    }

    .grid {
        /* background-image: repeating-linear-gradient(0 deg, transparent, transparent 70 px, #CCC 70 px, #CCC 71 px), repeating-linear-gradient(- 90 deg, transparent, transparent 70 px, #CCC 70 px, #CCC 71 px);
         background-size: 71 px 71 px;*/
    }
</style>