<template>
    <b-dropdown :text="label" variant="white">
        <b-dropdown-item
                v-for="item in items"
                v-bind:key="item.id"
                :class="itemClass"
                v-on:click="onItemClick(item)" href="#">
            {{ getItemName(item) }}
        </b-dropdown-item>
    </b-dropdown>
</template>
<script>
    import _ from 'underscore';
    import {isObject,get as safeGet} from 'lodash';
    import abstractField from "../../../fields/abstractField";

    export default {
        data(){
            return {
                label:''
            }
        },
        mixins: [abstractField],
        methods:{
            groupValues(values) {
                let array = [];
                let arrayElement = {};

                values.forEach(item => {
                    arrayElement = null;

                    if (item.group && isObject(item)) {
                        // There is in a group.

                        // Find element with this group.
                        arrayElement = find(array, i => i.group === item.group);

                        if (arrayElement) {
                            // There is such a group.

                            arrayElement.ops.push({
                                id: item.id,
                                name: item.name
                            });
                        } else {
                            // There is not such a group.

                            // Initialising.
                            arrayElement = {
                                group: "",
                                ops: []
                            };

                            // Set group.
                            arrayElement.group = item.group;

                            // Set Group element.
                            arrayElement.ops.push({
                                id: item.id,
                                name: item.name
                            });

                            // Add array.
                            array.push(arrayElement);
                        }
                    } else {
                        // There is not in a group.
                        array.push(item);
                    }
                });

                // With Groups.
                return array;
            },
            getItemName(item) {
                if (isObject(item)) {
                    if (typeof item["name"] !== "undefined") {
                        return item.name;
                    } else {
                        throw "`name` is not defined. If you want to use another key name, add a `name` property under `selectOptions` in the schema. https://icebob.gitbooks.io/vueformgenerator/content/fields/select.html#select-field-with-object-items";
                    }
                } else {
                    return item;
                }
            },
            onItemClick(item){
                this.value = item.id;
            },
            getLabel(){
                let labelFn = safeGet(this.schema,'label','');
                if(_.isFunction(labelFn)){
                    return labelFn.apply(this,[this.value,this.model]);
                }
                return labelFn||'';
            }
        },
        computed:{
            items() {
                let values = this.schema.values;
                return _.clone(values);
            },
            rootClass(){
                let result = {btn:true};
                if(!this.schema.rootClass){
                    result['dropdown-toggle']=true;
                    //result['dropdown-toggle-split']=true;
                }else
                    result[this.schema.rootClass]=true;
                return result;
            },
            itemClass(){
                let result = {'dropdown-item':true};
                if(this.schema.itemClass){
                    result[this.schema.itemClass] = true;
                }
                return result;
            }
        },

        watch:{
            value:{
                immediate:true,
                deep:true,
                handler(){
                    this.label = this.getLabel();
                }
            }
        }
    }
</script>