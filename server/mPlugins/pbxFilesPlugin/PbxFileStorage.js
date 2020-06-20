import check from 'check-types';
import _ from 'underscore';
import path from 'path';
import async from 'async';
import mkdirp from 'mkdirp';
import mv from 'mv';
import fs from 'fs';
import SoxCommand from 'sox-audio';
import YandexDiskAccounts from "/modules/utils/models/YandexDiskAccounts";
import {exists, meteorRnd} from "/server/lib/utils";
import validFilename from 'sanitize-filename';

export default class PbxFileStorage{
    constructor () {

    }

    attachmentDir (attachment) {
        let dir = this._options.directory;
        if (_.isFunction(dir)) {
            dir = this._options.directory.apply(attachment)
        }
        return dir
    }

    save (model,attachment, callback) {
        const DIR = model.localDir;
        _.seqNew([
            async function filePath(){
                let originalValidName = null;
                if(attachment.name){
                    originalValidName = validFilename(attachment.name);
                }else if(attachment.path){
                    originalValidName = validFilename(path.basename(attachment.path));
                }
                let validName = originalValidName ? originalValidName : meteorRnd();
                let alreadyExists = await exists(DIR,validName);
                if(alreadyExists) {
                    validName = _.compact ([meteorRnd (), originalValidName]).join ('-');
                }
                return path.resolve(DIR,validName);
            },
            function mkdir(h,cb){
                mkdirp(DIR, cb);
            },
            function write(h,cb){
                if (attachment.path) {
                    mv(attachment.path, h.filePath, cb)
                } else if (attachment.stream) {
                    const writeStream = fs.createWriteStream(h.filePath);
                    attachment.stream.once('error', cb);
                    attachment.stream.pipe(writeStream).once('finish', function () {
                        if (attachment.size) {
                            return cb()
                        }
                        fs.stat(h.filePath, (error, stats) => {
                            if (!error) {
                                attachment.size = stats.size
                            }
                            cb();
                        })
                    })
                } else if (attachment.buffer) {
                    fs.writeFile(h.filePath, attachment.buffer, cb);
                }
            }
        ],function transform(err,h){
            callback(err, h.filePath);
        });
    }

    /**@param {object} original
     * @param {string} original.path
     * @returns Promise<object>
     * */
    saveAsterisk(model,original){
        const baseAsteriskName = path.basename(original.path,path.extname(original.path))+'_asterisk.wav';
        const asteriskPath = path.dirname(original.path)+ `/`+baseAsteriskName;
        const asteriskVersion = {
            path:asteriskPath
        };
        return new Promise((resolve,reject)=>{
            const command = SoxCommand({captureStderr:true});
            command.input(original.path)
            .output(asteriskPath)
            .outputBits(16)
            .outputSampleRate(8000)
            .outputChannels(1)
            .outputFileType('wav');

            command.once('error', reject);
            command.on('end', function() {
                fs.stat(asteriskPath,(err,stat)=>{
                    if(err)
                        return reject(err);
                    asteriskVersion.size = stat.size;
                    asteriskVersion.name = baseAsteriskName;
                    asteriskVersion.type = 'audio/x-wav';
                    resolve(asteriskVersion);
                });
            });
            command.run();
        });
    }

    /**@param {object} original
     * @param {string} original.path
     * @param {string} original.size
     * @param {string} original.name
     * @returns Promise<object>
     * */
    async saveRemote(model,original){
        /**@type {YandexDiskAccounts}*/
        let yandexDiskAccount = await YandexDiskAccounts.random();
        if(!yandexDiskAccount)
            return Promise.reject(new Error('Нет аккаунта для удаленной загрузки'));
        const client = yandexDiskAccount.client;
        const DIR = model.remoteDir;
        const remoteName = path.basename(original.path);
        const remotePath = path.resolve(DIR,  path.resolve( DIR,remoteName ) );

        const remoteVersion = {
            path:remotePath,
            size:original.size,
            name:remoteName,
            type:'audio/x-wav',
            yadisk:yandexDiskAccount.login
        };
        return _.seqNew([
            function ensureDir(){
                return client.ensureDir(DIR);
            },
            function upload(h,cb) {
                client.uploadFile(
                    original.path , remotePath
                ,cb);
            },
            function exists(h,cb){
                client.exists(remotePath,cb);
            }
        ],function transform(err,h) {
            if(err||!h.exists)
                return undefined;
            return remoteVersion;
        });
    }

    removeLocal(path) {
        return new Promise((resolve,reject)=>{
            fs.unlink(path, (error) => {
                if (error && error.code === 'ENOENT') {
                    error = null
                }
                if(error)
                    return reject(error);
                return resolve(true);
            })
        });
    }

    /**@return {Promise<YandexDisk>}*/
    async yaDiskClient(remoteVersion){
        /**@type {YandexDiskAccounts}*/
        let yandexDiskAccount = null;
        if(remoteVersion.yadisk) {
            if (YandexDiskAccounts.cursor) {
                let models = await YandexDiskAccounts.cursor.models();
                yandexDiskAccount = _.find(models,/**@param {YandexDiskAccounts} model*/(model)=>{
                    return model.login === remoteVersion.yadisk;
                });
            }
            if(!yandexDiskAccount){
                yandexDiskAccount = await YandexDiskAccounts.findOne({login:remoteVersion.yadisk});
            }
        }
        if(!yandexDiskAccount){
            throw new Error('Не найден аккаунт ЯДиск');
        }
        return yandexDiskAccount.client;
    }

    async removeRemote(remoteVersion){
        const client = await this.yaDiskClient(remoteVersion);
        return client.remove(remoteVersion.path).then(()=>{
            return true;
        });
    }



}