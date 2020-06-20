import mongoose from 'mongoose';
import {Schema} from 'mongoose';
import crate from 'mongoose-crate';
import {exists, meteorRnd} from "../../server/lib/utils";
import {LocalFsStorageProvider,FileProcessor} from 'mongoose-crate';
import _ from 'underscore';
import validFilename from 'sanitize-filename';
import Servers from "../cluster/models/Servers";
import HttpClient from "../../server/lib/HttpClient";
import {get as safeGet} from 'lodash';
import path from 'path';
/**
 * @constructor TmpFiles
 * @property {string} id
 * @property {string} url
 * @property {number} size
 * @property {object} versions
 * @property {object} versions.original
 * @property {object} versions.original.path
 * @property {object} versions.original.size
 * @property {string} extension
 */
const TmpFilesSchema = new Schema({
    user_id:{type:String,default:null},
    expires:{
        type:Date,default(){
            return new Date(Date.now()+7*24*3600*1000)
        }
    }
});

TmpFilesSchema.set('toJSON', {
    transform: function(doc, ret, options) {
        delete ret.__cached_attachments;
        return ret;
    }
});

TmpFilesSchema.set('toObject', {
    transform: function(doc, ret, options) {
        delete ret.__cached_attachments;
        return ret;
    }
});

TmpFilesSchema.virtual('url').get(function(){
    let server = Servers.current;
    if(!server)
        return null;
    /**@type {NodeInstances}*/
    let nodeInstance = Servers.nodeInstance;
    if(!nodeInstance)
        return null;
    return HttpClient.resolveUrl(nodeInstance.base_url,`/tmpFiles/original/${this.id}`);
});

TmpFilesSchema.virtual('extension').get(function(){
    let filePath = safeGet(this.versions,'original.path','') || safeGet(this.versions,'original.name','');
    return path.extname( filePath ).toLowerCase();
});

TmpFilesSchema.virtual('size').get(function(){
    return  safeGet(this.versions,'original.size',0);
});

const storage = new LocalFsStorageProvider({
    directory(){
        return path.resolve(process.env.STORAGE_PATH, 'tmpFiles');
    },
    path:async function(){
        const attachment = this;
        const DIR = path.resolve(process.env.STORAGE_PATH, 'tmpFiles');
        let originalValidName = null;
        if(attachment.name){
            originalValidName = validFilename(attachment.name);
        }
        let validName = originalValidName ? validFilename(attachment.name) : meteorRnd();
        let alreadyExists = await exists(DIR,validName);
        if(!alreadyExists)
            return validName;
        let result = _.compact([meteorRnd(),originalValidName]).join('-');
        return result;
    }
});
const processor = new FileProcessor(storage);

TmpFilesSchema.plugin(crate, {
    fields: {
        'versions.original': {processor},
    }
});

TmpFilesSchema.virtual('fileName').
get(function() {
    return safeGet(this,'versions.original.name','');
});

/**
 * @class TmpFilesDoc
 * @property {string} name
 * @property {string} region_id
 **/
const TmpFiles = mongoose.model('tmpFiles',TmpFilesSchema,'tmpFiles');


export default TmpFiles;