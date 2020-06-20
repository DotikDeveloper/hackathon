import mongoose from 'mongoose';
import observeChangesPlugin from "mongoose-observe";
/**
 * @constructor AclRoles
 * @property {string} name
 * @property {string} label
 * */
const Schema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        unique:true
    },
    label:{
        type: String,
        required: true,
        unique:true
    },
    resources:{
        type:mongoose.Schema.Types.Mixed,
        default(){
            return {};
        }
    }
}, /*{ strict: true }*/);
Schema.plugin(observeChangesPlugin);
const AclRoles = mongoose.model('aclRoles',Schema,'aclRoles');


export default AclRoles;