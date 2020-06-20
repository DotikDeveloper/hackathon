<template>
    <div class="cabinet">
        <div class="cabinet-nav">
            <tree :data="treeData" :options="treeOptions" :filter="treeFilter" v-model="selectedNode">
                <div class="tree-scope" slot-scope="{ node }">
                    <template v-if="node.data.isRoot">
                        <!-- you can add an icon here, but it is too long for the demo... sorry  -->

                        <span class="text">
                  {{ node.text }}
                </span>

                        <span class="release" v-if="!node.hasChildren()">
                  {{ node.data.release }}
                </span>
                    </template>
                    <template v-else>

                        <!-- here we can leave a vue-router for example... -->

                        <span class="text">
                    {{ node.text }}
                  </span>

                        <span class="release">
                    {{ node.data.release }}
                  </span>
                    </template>
                </div>
            </tree>
        </div>
        <div class="cabinet-content">
            <div v-if="!selectedNode || selectedNode.hasChildren()">Welcome!</div>
            <ul v-else>
                <component v-bind:is="selectedNode.data.component"/>
            </ul>
        </div>
    </div>
</template>

<script>
    import Account from "./Account";

    const treeData = [{
        "name": "Аккаунт",
        component:Account
    }];
    export default {
        data: () => {
            return {
                selectedNode: null,
                treeFilter: '',
                treeOptions: {
                    multiple: false,
                    filter: {
                        plainList: true
                    }
                },

                // do not judge me :)
                treeData: new Promise(resolve => {
                    const items = {}

                    treeData.forEach(item => {
                        const { name } = item;

                        if (false === (name in items)) {
                            items[name] = []
                        }

                        let treeItem = {
                            text: item.version ? `${item.name} ${item.version}` : item.name,
                            data: item
                        }

                        items[name].push(treeItem)
                    })

                    let o = Object.keys(items).reduce((a, b) => {
                        let children = items[b]
                        let item

                        if (children.length > 1) {
                            item = {
                                text: children[0].data.name,
                                data: Object.assign({}, children[0].data),
                                children
                            }
                        } else {
                            item = children[0]
                            item.data
                        }

                        if (!item.data) {
                            item.data = {
                                type: children[0].data.type,
                                isRoot: true
                            }
                        } else {
                            item.data.isRoot = true
                        }

                        a.push(item)

                        return a
                    }, [])

                    resolve(o)
                })
            }
        },

        methods: {
        }

    }
</script>

<style scoped>
    .cabinet {
        display: grid;
        grid-template-columns: minmax(200px, 10%) 90%;
    }
</style>