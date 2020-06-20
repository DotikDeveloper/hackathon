<template>
	<div class="form-group" :class="getFieldRowClasses(field)">
		<label v-if="fieldTypeHasLabel(field)" :for="getFieldID(field)" :class="field.labelClasses">
			<span v-text="field.label"></span>
			<span v-if='field.help' class="help">
				<i class="icon"></i>
				<div class="helpText" v-html='field.help'></div>
			</span>
		</label>

		<div class="field-wrap">
			<component :path="path" ref="child" :is="getFieldType(field)" :vfg="vfg" :disabled="fieldDisabled(field)" :model="model" :schema="field" :formOptions="options" @model-updated="onModelUpdated" @validated="onFieldValidated"></component>
			<div v-if="buttonVisibility(field)" class="buttons">
				<button v-for="(btn, index) in field.buttons" @click="buttonClickHandler(btn, field, $event)" :class="btn.classes" :key="index" v-text="btn.label" :type="getButtonType(btn)"></button>
			</div>
		</div>

		<div v-if="field.hint" class="hint" v-html="fieldHint(field)"></div>

		<div v-if="fieldErrors(field).length>0 && field.type!='object' && field.type!='array'" class="errors help-block">
			<span v-for="(error, index) in fieldErrors(field)" :key="index" v-html="error"></span>
		</div>
	</div>
</template>
<script>
	import FormGroupMixin from "./FormGroupMixin";
	import Vue from 'vue';
	export default Vue.extend({
		mixins:[FormGroupMixin],
		computed:{
			componentName(){
				return 'DefaultFormGroup';
			}
		}
	});
</script>
<style lang="scss">
$errorColor: #f00;
.form-group:not([class*=" col-"]) {
	width: 100%;
}
.form-group {
	display: inline-block;
	vertical-align: top;
	// width: 100%;
	// margin: 0.5rem 0.26rem;
	margin-bottom: 1rem;

	label {
		font-weight: 400;
		& > :first-child {
			display: inline-block;
		}
	}

	&.featured {
		> label {
			font-weight: bold;
		}
	}

	&.required {
		> label:after {
			content: "*";
			font-weight: normal;
			color: Red;
			// position: absolute;
			padding-left: 0.2em;
			font-size: 1em;
		}
	}

	&.disabled {
		> label {
			color: #666;
			font-style: italic;
		}
	}

	&.error {
		input:not([type="checkbox"]):not(.wrapper *),
		textarea,
		select {
			border: 1px solid $errorColor;
			background-color: rgba($errorColor, 0.15);
		}

		.errors {
			color: $errorColor;
			font-size: 0.8em;
			span {
				display: block;
				background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAiklEQVR4Xt2TMQoCQQxF3xdhu72MpZU3GU/meBFLOztPYrVWsQmEWSaMsIXgK8P8RyYkMjO2sAN+K9gTIAmDAlzoUzE7p4IFytvDCQWJKSStYB2efcAvqZFM0BcstMx5naSDYFzfLhh/4SmRM+6Agw/xIX0tKEDFufeDNRUc4XqLRz3qabVIf3BMHwl6Ktexn3nmAAAAAElFTkSuQmCC");
				background-repeat: no-repeat;
				padding-left: 17px;
				padding-top: 0px;
				margin-top: 0.2em;
				font-weight: 600;
			}
		}
	}
}
</style>
