<template>
    <button
            :id="getFieldID(schema)"
            type="submit"
            @click="onClick"
            :name="schema.inputName"
            :disabled="disabled"
            :class="getFieldClasses()"
            v-attributes="'input'"
	>{{schema.buttonText}}</button>
</template>

<script>
import fieldSubmitScript from "../../../fields/core/fieldSubmitScript";
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
