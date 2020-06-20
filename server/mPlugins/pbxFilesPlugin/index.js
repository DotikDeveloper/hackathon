import Servers from "../../../modules/cluster/models/Servers";
import HttpClient from "../../lib/HttpClient";
import _ from 'underscore';
import {get as safeGet} from 'lodash';
import path from 'path';
import {formatRuDate} from "../../../lib/utils";
import crate from 'mongoose-crate';
import {exists} from "../../lib/utils";
import PbxFileProcessor from "./PbxFileProcessor";
import fs from 'fs';
import {Transform} from 'stream';
import pbxFilesRouter from './router';

/**
 * @param {object} options
 * @param {string} options.modelName
 * @param {string} options.baseLocalDir
 * @param {string|Function} options.relativeDir
 * @param {object} versions
 * @param {boolean} versions.asterisk
 * @param {boolean} versions.remote
 * */
export default function pbxFilesPlugin(schema,options){
    options.versions = options.versions||{};
    options.baseLocalDir = options.baseLocalDir || process.env.STORAGE_PATH;
    options.relativeDir = options.relativeDir || function(){
        return `${options.modelName}/${formatRuDate(this.created)}`;
        //return `${options.modelName}/${formatRuDate(this.created)}/${this.created.getHours()}`;
    };

    const processor = new PbxFileProcessor (options.versions);

    schema.methods.createReadStream = function (version) {
        let versions = this.versions;

        return _.seqNew ([
            function original (h, cb) {
                if (version == 'remote')
                    return cb ();
                let original = safeGet (versions, version);
                if (!original || !original.path)
                    return cb ();
                return exists (original.path).then ((isExist) => {
                    if (isExist)
                        return fs.createReadStream (original.path);
                    return null;
                });
            },
            function remote (h, cb) {
                if (h.original || (version !== 'original' && version !== 'remote'))
                    return cb ();
                let remote = safeGet (versions, 'remote');
                if (!remote || !remote.path)
                    return cb ();
                return processor.storage.yaDiskClient (remote).then ((client) => {
                    return client.readFile (remote.path);
                });
            }
        ], function transform (err, h) {
            if (err)
                throw err;
            let stream = _.chain (h)
            .values ()
            .find ((stream) => {
                return !!stream;
            })
            .value ();
            if (!stream) {
                throw new Error ('Файл не найден');
            }
            return stream;
        });
    };

    schema.methods.url = function (version, permanent, cb) {
        if (!permanent) {
            let server = Servers.current;
            if (!server)
                return null;
            /**@type {ServerNode}*/
            let node = Servers.node;
            if (!node)
                return null;
            return HttpClient.resolveUrl (node.base_url, `/${options.modelName}/${version}/${this.id}`);
        } else {
            let server = _.find (Servers.models, (serverModel) => {
                return serverModel.isMaster;
            });
            if (!server)
                return null;
            /**@type {NodeInstances}*/
            let nodeInstance = Servers.nodeInstance;
            let baseUrl = nodeInstance?.base_url;
            if (!baseUrl)
                return null;
            return HttpClient.resolveUrl (baseUrl, `/${options.modelName}/${version}/${this.id}`);
        }
    };

    schema.virtual('urls').get (function () {
        return {
            original: {
                permanent: this.url ('original', true),
                short: this.url ('original', false)
            },
            asterisk: {
                permanent: this.url ('asterisk', true),
                short: this.url ('asterisk', false)
            }
        };
    });

    schema.virtual ('fileName').get (function () {
        return safeGet (this, 'versions.original.name', '?');
    });
    schema.virtual ('size').get (function () {
        return safeGet (this, 'versions.original.size', 0);
    });

    schema.add ({
        created: {
            type: Date,
            get (created) {
                return created || new Date ();
            },
            default () {
                return new Date ();
            }
        }
    });

    schema.virtual ('relativeDir').get (function () {
        if (_.isFunction (options.relativeDir))
            return options.relativeDir.apply (this);
        return options.relativeDir;
    });

    schema.virtual ('localDir').get (function () {
        return path.resolve (
            options.baseLocalDir,
            this.relativeDir
        );
    });

    schema.virtual ('remoteDir').get (function () {
        return path.resolve ('/', this.relativeDir);
    });

    schema.plugin (crate, {
        fields: {
            'versions': {processor},
        }
    });

}

export {
    pbxFilesRouter
}

