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
import fs from "fs";
import gm from 'gm';

/**
 * @constructor ImageFiles
 * @property {string} id
 * @property {string} url
 * @property {number} size
 * @property {object} versions
 * @property {object} versions.original
 * @property {object} versions.original.path
 * @property {object} versions.original.size
 * @property {string} extension
 * @property {object} urls
 * @property {string} urls.original
 * @property {string} urls.small
 * @property {string} urls.medium
 */
const ImageFilesSchema = new Schema({
    user_id:{type:String,default:null},
    expires:{
        type:Date,default(){
            return new Date(Date.now()+7*24*3600*1000)
        }
    }
});

ImageFilesSchema.set('toJSON', {
    transform: function(doc, ret, options) {
        delete ret.__cached_attachments;
        return ret;
    }
});

ImageFilesSchema.set('toObject', {
    transform: function(doc, ret, options) {
        delete ret.__cached_attachments;
        return ret;
    }
});

ImageFilesSchema.virtual('url').get(function(){
    let server = Servers.current;
    if(!server)
        return null;
    /**@type {ServerNode}*/
    let nodeInstance = Servers.nodeInstance;
    if(!nodeInstance)
        return null;
    return HttpClient.resolveUrl(nodeInstance.base_url,`/imageFiles/original/${this.id}`);
});

ImageFilesSchema.virtual('urls').get(function(){
    let getVersionUrl = (version)=>{
        let server = Servers.current;
        if(!server)
            return null;
        /**@type {NodeInstances}*/
        let nodeInstance = Servers.nodeInstance;
        if(!nodeInstance)
            return null;
        return HttpClient.resolveUrl(nodeInstance.base_url,`/imageFiles/${version}/${this.id}`);
    };

    return {
        original:getVersionUrl('original'),
        small:getVersionUrl('small'),
        medium:getVersionUrl('medium'),
    }
});

ImageFilesSchema.virtual('extension').get(function(){
    let filePath = safeGet(this.versions,'original.path','') || safeGet(this.versions,'original.name','');
    return path.extname( filePath ).toLowerCase();
});

ImageFilesSchema.virtual('size').get(function(){
    return  safeGet(this.versions,'original.size',0);
});

const storage = new LocalFsStorageProvider({
    directory(){
        return path.resolve(process.env.STORAGE_PATH, 'imageFiles');
    },
    path:async function(){
        const attachment = this;
        const DIR = path.resolve(process.env.STORAGE_PATH, 'imageFiles');
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

ImageFilesSchema.plugin(crate, {
    fields: {
        'versions.original': {processor},
        'versions.small': {processor},
        'versions.medium': {processor},
    }
});

ImageFilesSchema.virtual('fileName').
get(function() {
    return safeGet(this,'versions.original.name','');
});

function imageConvert(path,x,y){
    return new Promise((resolve,reject)=>{
        gm(path)
        .resize(x,y)
        .toBuffer( function(err, buffer) {
            if(err){
                return fs.readFile(path,(err,buffer)=>{
                    if(err)
                        return reject(err);
                    return resolve(buffer);
                });
            }
            return resolve(buffer);
        });
    });

}

ImageFilesSchema.pre('save', async function() {
    if(this.isModified('versions.original')){
        let originalPath = this.versions.original.path;
        const baseName = path.basename (this.versions.original.name||originalPath, this.extension);

        let smallBuffer = await imageConvert(originalPath,50,50);
        await this.attach ('versions.small', {
            name: `${baseName}_small${this.extension}`,
            buffer:smallBuffer,
        });

        let mediumBuffer = await imageConvert(originalPath,50,50);
        await this.attach ('versions.small', {
            name: `${baseName}_small${this.extension}`,
            buffer:mediumBuffer,
        });
    }
});

/**
 * @class ImageFilesDoc
 * @property {string} name
 * @property {string} region_id
 **/
const ImageFiles = mongoose.model('imageFiles',ImageFilesSchema,'imageFiles');


export default ImageFiles;