import {get as safeGet} from 'lodash';
import _ from 'underscore';
import PbxFileStorage from "./PbxFileStorage";

export default class PbxFileProcessor{
    /**@param {object} options
     * @param {boolean} options.original
     * @param {object} options.remote
     * @param {object} options.asterisk
     * */
    constructor (options) {
        this.storage = new PbxFileStorage();
        this.original = safeGet(options,'original',true);
        this.asterisk = safeGet(options,'asterisk',true);
        this.remote = safeGet(options,'remote',true);
    }

    createFieldSchema () {
        return {
            original:{
                size: Number,
                name: String,
                type: {
                    type: String
                },
                path: String
            },
            remote:{
                size: Number,
                name: String,
                type: {
                    type: String
                },
                path: String,
                yadisk:String
            },
            asterisk:{
                size: Number,
                name: String,
                type: {
                    type: String
                },
                path: String
            }
        }
    }

    process (model,attachment, property, callback) {
        const self = this;
        const storage = this.storage;
        _.seqNew([
            function original(h,cb){
                storage.save(model,attachment, (error, path) => {
                    property.original = {
                        size:attachment.size,
                        name:attachment.name,
                        type:attachment.type,
                        path:path,
                        date:attachment.date
                    };
                    cb(error);
                });
            },
            async function asterisk(h,cb){
                if(!self.asterisk)
                    return Promise.resolve(undefined);
                return storage.saveAsterisk(model,property.original).then((asterisk)=>{
                    property.asterisk = asterisk;
                });
            },
            async function remote(h,cb){
                if(!self.remote)
                    return Promise.resolve(undefined);
                return storage.saveRemote(model,property.original).then((remote)=>{
                    if(remote)
                        property.remote = remote;
                });
            },
        ]).then((h)=>{
            return callback(null);
        },(err)=>{
            return callback(err);
        });
    }

    willOverwrite (model) {
        let result = _.some([
            safeGet(model,'original.path'),
            safeGet(model,'asterisk.path'),
            safeGet(model,'remote.path'),
        ]);
        return result;
    }

    remove (model, callback) {
        const storage = this.storage;
        _.seqNew([
            function removeOriginal(h,cb){
                let path = safeGet(model,'original.path');
                if(!path)
                    return cb(null,false);
                return storage.removeLocal(path);
            },
            function removeAsterisk(h,cb){
                let path = safeGet(model,'asterisk.path');
                if(!path)
                    return cb(null,false);
                return storage.removeLocal(path);
            },
            function removeRemote(h,cb){
                let remoteVersion = safeGet(model,'remote');
                if(!remoteVersion||!remoteVersion.path)
                    return cb(null,false);
                return storage.removeRemote(remoteVersion);
            }
        ],(err,h)=>{
            callback(err);
        });
    }


}