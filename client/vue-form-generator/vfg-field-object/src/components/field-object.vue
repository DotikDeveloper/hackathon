<template>
  <div><!--style="width:100%;"!-->
    <div v-if="computedSchema">
      <vue-form-generator :schema="computedSchema" :model="value" :options="formOptions"
                          @model-updated="onModelUpdated"
                          ref="vfg"
                          :path="path"
      ></vue-form-generator>
    </div>
    <div v-else>
      <table :id="getFieldID(schema)" :class="schema.fieldClasses">
        <tr v-bind:key="index" v-for="(item, index) in value">
          <td>
            {{index}}
          </td>
          <td v-if="keyTypes[index] === 'string'">
            <input type="text" v-model="value[index]"/>
          </td>
          <td v-if="keyTypes[index] === 'boolean'">
            <input type="checkbox" v-model="value[index]"/>
          </td>
          <td v-if="keyTypes[index] === 'number'">
            <input type="number" v-model="value[index]"/>
          </td>
          <td>
            <input type="button" value="x" @click="removeElement(index)"/>
          </td>
        </tr>
      </table>
      <select v-model="newKeyType">
        <option value="string">String</option>
        <option value="number">Number</option>
        <option value="boolean">Boolean</option>
      </select>

      <input type="text" v-model="newKeyName"/>
      <input type="button" value="Add key" @click="addKey"/>
    </div>
  </div>
</template>

<script>
  import * as VueFormGenerator from "../../../main";
  import _ from 'underscore';

  export default {
    mixins: [VueFormGenerator.abstractField],

    created() {
      if (!this.value) this.value = {};
    },

    mounted() {
      if (!this.value) return;

      let valueKeys = Object.keys(this.value);
      let keyTypes = {};

      for (let i = 0; i < valueKeys.length; i++) {
        let key = valueKeys[i];
        keyTypes[key] = typeof this.value[key];
      }
      this.keyTypes = keyTypes;
    },

    data() {
      return {
        newKeyType: "string",
        newKeyName: "",
        keyTypes: {}
      };
    },

    methods: {
      // eslint-disable-next-line no-unused-vars
        onModelUpdated(model, schema){
              //console.log('field-object onModelUpdated:',{model,schema,value:this.value,thisSchema:this.schema});
              this.$emit('model-updated',this.value,this.schema)
        },
        removeElement(index) {
            let value = this.value;
            delete value[index];

            this.value = { ...value };

            let keyTypes = this.keyTypes;
            delete keyTypes[index];

            this.keyTypes = { ...keyTypes };
        },

        addKey() {
            //TODO change to vm.$set
            try {
                //Vue.set (this.value, this.newKeyName, undefined);
                //Vue.set (this.keyTypes, this.newKeyName, this.newKeyType);
                this.newKeyName = "";
            }catch (e) {
                console.log(e);
            }
        },

        validate() {
            this.clearValidationErrors();
            return this.$refs.vfg.validate(true).then((errors)=>{
                let formErrors = _.pluck(errors,'error');
                this.$emit("validated", _.isEmpty(formErrors), formErrors, this);
                this.errors = _.clone(formErrors);
                return formErrors;
            });
        }
    },

    computed:{
      computedSchema(){
        let result = null;
        if(this.schema.schema)
          result = {...this.schema.schema};
        if(this.schema.fields)
          result =  {fields:this.schema.fields};

        if(result&&this.vfg){
          _.each(['fieldClasses','formGroupClass','labelClass','theme'],(propKey)=>{
              if(this.vfg.schema&&this.vfg.schema[propKey]&&result[propKey]===undefined)
                result[propKey] = this.vfg.schema[propKey]
          });
        }else if(this.schema){
          _.each(['fieldClasses','formGroupClass','labelClass','theme'],(propKey)=>{
            if(this.schema&&this.schema[propKey]&&result[propKey]===undefined)
              result[propKey] = this.schema[propKey]
          });
        }
        return result;
      }
    }
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
