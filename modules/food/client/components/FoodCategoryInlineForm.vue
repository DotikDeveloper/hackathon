<template>
    <div>
        <template v-if="$apolloLoading">
            <vue-loading/>
        </template>
        <select v-else @change="onChange">
            <option value="" :selected="noCategory()">НЕТ</option>
            <option v-for="foodCategory in foodCategories"
                    :value="foodCategory._id"
                    :selected="isSelected(foodCategory)">
                {{foodCategory.icon}} {{foodCategory.name}}
            </option>
        </select>
    </div>
</template>

<script>
    import gql from 'graphql-tag';
    import {graphqlClone} from "../../../../lib/utils";

    export default {
        props:['model'],
        data () {
            return {
                loaded: false,
                foodCategories:[]
            }
        },
        methods:{
            isSelected(foodCategory){
                return this.model.food_category_id && foodCategory._id === this.model.food_category_id;
            },
            noCategory(){
                return !this.model.food_category_id ||
                    !_.find( this.foodCategories , (foodCategory)=>{
                        return foodCategory._id === this.model.food_category_id
                    });
            },
            async onChange(event) {
                let newValue = event.target.value;
                let newCategory = _.find(this.foodCategories,(foodCategory)=>{
                    return foodCategory._id === newValue;
                });
                if(!newCategory){
                    this.model.foodCategory = null;
                    this.model.food_category_id = null;
                }else{
                    this.model.foodCategory = newCategory;
                    this.model.food_category_id = newCategory._id;
                }
                let mutation = {
                    mutation:gql`mutation YaMarketCategoriesEdit ($_id:String!,$model:JSONObject!) {
                                    yaMarketCategories{
                                        edit(_id:$_id,model:$model){
                                            message,success,errors
                                        }
                                    }
                                }
                            `,
                    variables:{
                        _id:this.model._id,
                        model:graphqlClone(this.model)
                    }
                };
                let mutateResponse = await this.$apollo.mutate(mutation);
                console.log({mutateResponse});
            }
        },
        async created () {
            let response = await this.apolloQuery ({
                query: gql`
                    query List($pagination:PaginationOptions){
                                        foodCategories{
                                            list(pagination:$pagination){
                                                rows{
                                                        _id
                                                        name
                                                        icon
                                                },
                                                total
                                            }
                                        }
                                    }
                `,
                variables:{
                    pagination:{
                        filters:{},
                        sort:{},
                        page:1,
                        perPage:1000
                    }
                }
            });
            this.foodCategories = response.data.foodCategories.list.rows;
            this.loaded = true;
        }
    }
</script>