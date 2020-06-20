import _ from 'underscore';
import {MongoClient} from 'mongodb';
import BufferedStream from "./lib/BufferedStream";
import {eachLimit} from 'async';

const ServerNames = [
    'db1server1.minta365.ru', 'db1server3.minta365.ru', 'db1server4.minta365.ru', 'db1server5.minta365.ru'
    , 'db1server6.minta365.ru', 'db1server7.minta365.ru', 'db1server8.minta365.ru', 'db1server9.minta365.ru'
    , 'db1server10.minta365.ru', 'db1server11.minta365.ru', 'db1server12.minta365.ru', 'db1server13.minta365.ru'
    , 'skyline.minta365.ru', 's14.minta365.ru'
];

export default class Calls2MongoReader {
    constructor (serverNames) {
        if (_.isString (serverNames))
            this.serverNames = [serverNames];
        else if (_.isArray (serverNames)) {
            this.serverNames = serverNames;
        }
        if (serverNames === undefined) {
            this.serverNames = ServerNames;
        }
    }

    findStream (collectionName, selector) {
        let stream = new BufferedStream ({objectMode: true});
        let limit = 1000;

        eachLimit (this.serverNames, 1, (serverName,callback) => {
            let url = serverName == 'localhost' ? 'mongodb://localhost:27017/calls2' : `mongodb://meteor:malibunproduct439800@${serverName}:27017/calls2`;
            const dbName = 'calls2';
            MongoClient.connect (url, async function (err, client) {
                if (err) {
                    stream.emit ('error', err);
                    return callback (err);
                }
                const db = client.db (dbName);
                const mongoCollection = db.collection (collectionName);
                let skip = 0;

                function iteration () {
                    return new Promise ((resolve, reject) => {
                        mongoCollection.find (selector, {limit, skip}).toArray (function (err, docs) {
                            if (err) {
                                stream.emit ('error', err);
                                return reject (err);
                            }
                            eachLimit (docs, 1, (doc, cb) => {
                                stream.write (doc, cb);
                            }).then (() => {
                                resolve (_.size (docs));
                            }, reject);
                        });
                    });
                }

                // eslint-disable-next-line no-constant-condition
                while (true) {
                    try {
                        let docsCount = await iteration ();
                        if (docsCount < limit) {
                            callback();
                            break;
                        } else {
                            skip += limit;
                        }
                    } catch (e) {
                        callback(e);
                        break;
                    }
                }


            });
        }).then (() => {
            stream.end (() => {
            });
        });

        return stream;
    }
}