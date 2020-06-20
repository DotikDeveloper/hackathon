export default function (schema,options={}) {
    schema.add({
        _relationsUpdated:{
            type:Date,
            default:null
        }
    });

    schema.methods.relationsMarkUpdated = async function(){
        this._relationsUpdated = new Date();
        return this.save();
    }
}