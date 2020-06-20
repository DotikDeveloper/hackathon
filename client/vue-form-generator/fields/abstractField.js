import { cloneDeep,isArray,isObject,get as objGet, forEach, isFunction
	, isString, debounce, uniqueId, uniq as arrayUniq } from "lodash";
import validators from "../utils/validators";
import { slugifyFormID } from "../utils/schema";
import _ from 'underscore';

function convertValidator(validator) {
	if (isString(validator)) {
		if (validators[validator] != null) return validators[validator];
		else {
			console.warn(`'${validator}' is not a validator function!`);
			return null; // caller need to handle null
		}
	}
	return validator;
}

function attributesDirective(el, binding, vnode) {
	let attrs = objGet(vnode.context, "schema.attributes", {});
	let container = binding.value || "input";
	if (isString(container)) {
		attrs = objGet(attrs, container) || attrs;
	}
	forEach(attrs, (val, key) => {
		el.setAttribute(key, val);
	});
}

export default {
	props: {
		vfg:{
			type: Object,
			//required: true
		},
		model:{
			type:Object
		},
		schema:{
			type:Object
		},
		formOptions:{
			type:Object
		},
		disabled:{},
		path:{
			type:String,default:''
		}
	},

	data() {
		return {
			errors: [],
			debouncedValidateFunc: null,
			debouncedFormatFunc: null
		};
	},

	directives: {
		attributes: {
			bind: attributesDirective,
			updated: attributesDirective,
			componentUpdated: attributesDirective
		}
	},

	computed: {
		value: {
			cache: false,
			get() {
				let val;
				if (isFunction(objGet(this.schema, "get"))) {
					val = this.schema.get(this.model);
				} else {
					val = objGet(this.model, this.schema.model);
				}
				if(val===undefined&&this.schema.default!==undefined){
					if (isFunction(this.schema.default)) {
						let $parentSchema = this.vfg?this.vfg.schema:null;
						val = this.schema.default.apply(this,[this.schema, $parentSchema, this.model]);
					} else if (isObject(this.schema.default) || isArray(this.schema.default)) {
						val = cloneDeep(this.schema.default);
					} else
						val = this.schema.default;
					if(val!==undefined){
						this.updateModelValue(val, undefined);
					}
				}

				return this.formatValueToField(val);
			},

			set(newValue) {
				console.log(`set ${this.path}:${newValue}`);
				let oldValue = this.value;
				newValue = this.formatValueToModel(newValue);

				if (isFunction(newValue)) {
					newValue(newValue, oldValue);
				} else {
					this.updateModelValue(newValue, oldValue);
				}
			}
		},

		/*parentModel:{
			cache: false,
			get() {
				return this.vfg.parentModel;
			}
		}*/
	},

	methods: {
		validate(calledParent) {
			this.clearValidationErrors();
			let results = [];

			if (this.schema.validator && this.schema.readonly !== true && this.disabled !== true) {
				let validators = [];
				if (!isArray(this.schema.validator)) {
					validators.push(convertValidator(this.schema.validator).bind(this));
				} else {
					forEach(this.schema.validator, validator => {
						validators.push(convertValidator(validator).bind(this));
					});
				}

				forEach(validators, validator => {
					results.push(validator(this.value, this.schema, this.model));
				});
			}

			let handleErrors = (errors) => {
				let fieldErrors = [];
				forEach(arrayUniq(errors), err => {
					if (isArray(err) && err.length > 0) {
						fieldErrors = fieldErrors.concat(err);
					} else if (isString(err)) {
						fieldErrors.push(err);
					}
				});
				if (isFunction(this.schema.onValidated)) {
					this.schema.onValidated.call(this, this.model, fieldErrors, this.schema);
				}

				let isValid = fieldErrors.length === 0;
				if (!calledParent) {
					this.$emit("validated", isValid, fieldErrors, this);
				}
				this.errors = fieldErrors;
				return fieldErrors;
			};
			return Promise.all(results).then(handleErrors);
		},

		debouncedValidate() {
			if (!isFunction(this.debouncedValidateFunc)) {
				this.debouncedValidateFunc = debounce(
					this.validate.bind(this),
					objGet(this.schema, "validateDebounceTime", objGet(this.formOptions, "validateDebounceTime", 500))
				);
			}
			this.debouncedValidateFunc();
		},

		updateModelValue(newValue, oldValue) {
			console.log('updateModelValue',{newValue, oldValue});
			let changed = false;
			if (isFunction(this.schema.set)) {
				this.schema.set(this.model, newValue);
				changed = true;
			} else if (this.schema.model) {
				this.setModelValueByPath(this.schema.model, newValue);
				changed = true;
			}

			if (changed) {
				this.$emit("model-updated", newValue, this.schema.model);

				if (isFunction(this.schema.onChanged)) {
					this.schema.onChanged.call(this, this.model, newValue, oldValue, this.schema);
				}

				if (objGet(this.formOptions, "validateAfterChanged", false) === true) {
					if (objGet(this.schema, "validateDebounceTime", objGet(this.formOptions, "validateDebounceTime", 0)) > 0) {
						this.debouncedValidate();
					} else {
						this.validate();
					}
				}
			}
		},

		clearValidationErrors() {
			this.errors.splice(0);
		},

		setModelValueByPath(path, value) {
			// convert array indexes to properties
			let s = path.replace(/\[(\w+)\]/g, ".$1");

			// strip a leading dot
			s = s.replace(/^\./, "");

			let o = this.model;
			const a = s.split(".");
			let i = 0;
			const n = a.length;
			while (i < n) {
				let k = a[i];
				if (i < n - 1)
					if (o[k] !== undefined) {
						// Found parent property. Step in
						o = o[k];
					} else {
						// Create missing property (new level)
						this.$root.$set(o, k, {});
						o = o[k];
					}
				else {
					// Set final property value
					this.$root.$set(o, k, value);
					return;
				}

				++i;
			}
		},

		getFieldID(schema, unique = false) {
			if(this.path)
				return this.path;
			if(schema.model=='pk'){
				console.log('pk getFieldID');
			}
			const idPrefix = _.chain([
				objGet(this, 'vfg.idPrefix', ""),
				objGet(this.formOptions, "fieldIdPrefix", "")
			]).map((prefix)=>{
				if(_.isFunction(prefix))
					return prefix.apply(this,[schema]);
				return prefix;
			})
			.compact()
			.value()
			.join('-');
			return slugifyFormID(schema, idPrefix) + (unique ? "-" + uniqueId() : "");
		},

		getFieldClasses() {
			let classes = _.clone( objGet(this.schema, "fieldClasses", []) );
			if(!_.isArray(classes)){
				classes = [classes];
			}
			if(classes.indexOf('form-control')==-1){
				classes.push('form-control');
			}

			let schemaClasses = _.clone( objGet(this.vfg, "schema.fieldClasses", []) );
			if(!_.isArray(schemaClasses)){
				schemaClasses = [schemaClasses];
			}
			_.each(schemaClasses,(schemaClass)=>{
				classes.push(schemaClass);
			});

			return classes;
		},

		formatValueToField(value) {
			return value;
		},

		formatValueToModel(value) {
			return value;
		}
	},

	created(){
        if(!this.vfg){
            console.log('VFG is undefined!!!',this)
        }else {
            /*console.log('abstractField', {
                model: this.model,
                'vfg.name': this.vfg.$options.name,
                '$parentModel': this.$parentModel
            });*/
        }
	}
};
