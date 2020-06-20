<template lang="pug">
	input(:id="getFieldID(schema)", type="submit", :value="schema.buttonText", @click="onClick", :name="schema.inputName", :disabled="disabled", :class="schema.fieldClasses", v-attributes="'input'")
</template>

<script>
import fieldSubmitScript from './fieldSubmitScript';
export default fieldSubmitScript;
</script>

<style lang="scss">
    /*
.vue-form-generator .field-submit input {
	// Default bootstrap primary button style
	color: #fff !important;
	background-color: #337ab7 !important;
	border-color: #2e6da4 !important;
}*/
</style>
