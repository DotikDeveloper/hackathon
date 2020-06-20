<template>
    <div class="custom-control custom-switch">
        <input type="checkbox"
               style="cursor: pointer;"
               v-model="value" :disabled="disabled" :name="schema.inputName"
               class="custom-control-input" :id="getFieldID(schema)"
        >
        <label
                style="cursor: pointer;"
                class="custom-control-label"
                :for="getFieldID(schema)"
        >{{schema.label}}</label>
    </div>
</template>

<script>
import abstractField from "../../../fields/abstractField";

export default {
	mixins: [abstractField],
};
</script>

<style lang="scss">
.custom-switch{
    cursor: pointer !important;
}
</style>
