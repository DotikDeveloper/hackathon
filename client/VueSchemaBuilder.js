import _ from 'underscore';
import __ from 'lodash';

export default class VueSchemaBuilder{
    constructor(vueSchema){
        this.vueSchema = __.cloneDeep( vueSchema );
    }

    /**@returns VueSchemaBuilder*/
    withFields(fields){
        if(!_.isArray(fields))
            fields=[fields];
        this.vueSchema.fields = this.vueSchema.fields || [];
        _.each(fields,(field)=>{
            this.vueSchema.fields.push(field);
        });
        return this;
    }

    withGroup(group){
        if(_.isArray(group))
            group={fields:group};
        this.vueSchema.groups = this.vueSchema.groups || [];
        this.vueSchema.groups.push(group);
        return this;
    }

    build(){
        return __.cloneDeep( this.vueSchema );
    }

}