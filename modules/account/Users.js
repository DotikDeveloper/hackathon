import mongoose,{Schema} from 'mongoose';
import bcrypt from 'bcrypt-nodejs';
import AclRoles from "/modules/acl2/models/AclRoles";
import {get as safeGet,set as safeSet} from 'lodash';
import LeanVirtuals from 'mongoose-lean-virtuals';
import Servers from "../cluster/models/Servers";
import observeChangesPlugin from "mongoose-observe";
import relationsUpdatedPlugin from "../../server/mPlugins/relationsUpdatedPlugin";
import _ from 'underscore';
/**
 * @constructor Users
 * @property {Users} currentUser
 * @property {AclRoles} role
 * @property {Servers} server
 * @property {Nodes} node
 * @property {NodeInstances} nodeInstance
 * */
const UsersSchema = new Schema({
    login: {
        type: String,
        unique: true,
        required: true
    },
    type:{
        type:String,
        validate: {
            validator(type) {
                return !!Users.types[type];
            },
            message(props){
                `${props.value} - неверный тип авторизации!`
            }
        },
    },
    name:{
        type:String,
        default(){
            return this.login;
        }
    },
    password: {
        type: String,
        required: function() {
            return this.type === 'password';
        }
    },
    avatar:{
        type:String
    },
    email:{
        type:String
    },
    roleName:{
        type:String,
        default:'customer'
    },
    passport:{
        type:mongoose.Schema.Types.Mixed ,
        default(){
            return {};
        }
    },

    currentUserId: { type: String,default:null},
    server_id:{type:String,default:null},
    node_id:{
        type:String
    },
    timezone:{
        type:String
    },

    publicData:{

    },

    data:{
        type:Schema.Types.Mixed,
        default(){
            return {}
        }
    }
});

UsersSchema.pre('save', async function() {
    if (this.type === Users.types.password.key && this.isModified('password') || this.isNew) {
        await new Promise ((resolve, reject) => {
            bcrypt.genSalt (10, (err, salt) => {
                if (err) {
                    return reject (err);
                }
                bcrypt.hash (this.password, salt, null, (err, hash) => {
                    if (err) {
                        return reject (err);
                    }
                    this.password = hash;
                    resolve ();
                });
            });
        });
    }

    if(!this.node_id){
        let server = Servers.current;
        if(server){
            if(!server.populated('defaultNode')){
                await server.populate('defaultNode').execPopulate();
            }
            if(server&&server.defaultNode){
                this.node_id = server.defaultNode.id;
            }
        }
    }
});

UsersSchema.virtual('role', {
    ref: AclRoles.modelName, // The model to use
    localField: 'roleName', // Find aclRoles where `name`
    foreignField: 'name', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
    justOne: true,
    options: {

    } // Query options, see http://bit.ly/mongoose-query-options
});

UsersSchema.virtual('currentUser', {
    ref: 'users', // The model to use
    localField: 'currentUserId', // Find aclRoles where `name`
    foreignField: '_id', // is equal to `foreignField`
    justOne: true,
    options: {

    }
});

UsersSchema.virtual('server', {
    ref:Servers, // The model to use
    localField: 'server_id', // Find aclRoles where `name`
    foreignField: '_id', // is equal to `foreignField`
    justOne: true,
    options: {

    }
});


UsersSchema.virtual('node', {
    ref:'nodes', // The model to use
    localField: 'node_id', // Find aclRoles where `name`
    foreignField: '_id', // is equal to `foreignField`
    justOne: true,
    options: {

    }
});

UsersSchema.virtual('nodeInstance')
.get(function(){
    return _.find(this.nodeInstances,(nodeInstance)=>{
        return nodeInstance.server_id === this.server_id;
    })
});

UsersSchema.virtual('nodeInstances', {
    ref:'nodeInstances', // The model to use
    localField: 'node_id',
    foreignField: 'node_id',
    justOne: false,
    options: {

    }
});





UsersSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

UsersSchema.plugin(LeanVirtuals);
UsersSchema.plugin(observeChangesPlugin);
UsersSchema.plugin(relationsUpdatedPlugin);

UsersSchema.set('toJSON', {
    transform: function(doc, ret, options) {
        delete ret.password;
        return ret;
    }
});

UsersSchema.set('toObject', {
    transform: function(doc, ret, options) {
        delete ret.password;
        return ret;
    }
});

/**
 * @class UsersDoc
 * @property {string} server_id
 * @property {object} node
 * @property {ServersDoc} server
 * @property {UsersDoc} currentUser
 * @property {AclRolesDoc} role
 * @property {string} login
 * @property {string} name
 * @property {string} password
 * @property {string} avatar
 * @property {string} email
 * @property {string} roleName
 * @property {object} passport
 **/

const Users = mongoose.model('users',UsersSchema);
Users.label = 'Пользователи';
Users.types = Object.freeze({
    password:   { key: "password", label: 'Пароль' },
    vk:  { key: 'vk', label: 'ВК' },
});


export default Users;