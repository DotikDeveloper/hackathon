import abstractField from "../abstractField";
// eslint-disable-next-line no-unused-vars
import { get as safeGet, isFunction, isEmpty } from "lodash";
import _ from 'underscore';
import {createDefaultObject} from "../../utils/schema";

export default {
    mixins: [abstractField],

    methods: {
        async onClick($event) {
            let createDefaults = safeGet(this.vfg.schema.formOptions,'createDefaults',true);
            if(createDefaults){
                createDefaultObject.apply(this,[this.vfg.schema,this.model]);
            }
            if (this.schema.validateBeforeSubmit === true) {
                // prevent a <form /> from having it's submit event triggered
                // when we have to validate data first
                $event.preventDefault();
                let errors = this.vfg.validate();
                if(_.isArray(errors)){
                    errors = await Promise.all(errors)
                }else if(errors && errors.then){
                    errors = await errors;
                }
                if (!isEmpty(errors)) {
                    if (isFunction(this.schema.onValidationError)) {
                        this.schema.onValidationError(this.model, this.schema, errors, $event);
                    }
                } else if (isFunction(this.schema.onSubmit)) {
                    this.schema.onSubmit(this.model, this.schema, $event);
                }
            } else if (isFunction(this.schema.onSubmit)) {
                // if we aren't validating, just pass the onSubmit handler the $event
                // so it can be handled there
                this.schema.onSubmit(this.model, this.schema, $event);
            }
        }
    }
};