import {get as safeGet} from 'lodash';
import HttpClient from "../../../server/lib/HttpClient";
import _ from 'underscore';
import YaGeoObject from "./YaGeoObject";
/**@name GeoPoint
 * @property {number} lat
 * @property {number} long
 * */

/**@name GeoRegion
 * @property {GeoPoint} lowerCorner
 * @property {GeoPoint} upperCorner
 * */

export default class YaGeoCoder {
    constructor () {
        this.kind = null;
        this.results = 1;
    }

    /**@returns {this}*/
    withOneResult(){
        this.results = 1;
        return this;
    }



    query (input) {
        return new Promise ((resolve, reject) => {
            let client =  HttpClient.forOptions ({
                url: 'https://geocode-maps.yandex.ru/1.x/',
                getParams: {
                    geocode: input.trim (),
                    results: this.kind ? 20 : this.results,
                    format: 'json',
                    apikey: _.sample ([
                        'f42d81a9-6622-4163-8e06-4842a941ba43',
                        'b7694597-95c8-40e9-ba59-f57ac4a1f3af',
                        '6868d08d-fea9-41c7-8f32-f3a3a33495ed',
                        '7d5334f1-6bfb-484f-a173-ebf8c560139b',
                        '3e267a09-6928-465d-a36c-86fa3bd4c0d8'
                    ])
                }
            });
            console.log(client.getUrl());

            client.execute ().then ((content) => {
                //console.log(client.getUrl());
                var response = safeGet (content, 'data.response', null);
                if (!response)
                    return reject (new Error ('Не удалось получить ответ'));
                //console.log(content.content);
                var featureMembers = safeGet (response, 'GeoObjectCollection.featureMember', []);
                if (_.isEmpty (featureMembers))
                    resolve (null);
                var result = _.chain (featureMembers)
                .filter ((featureMember) => {
                    var geoObject = safeGet (featureMember, 'GeoObject', null);
                    if (!geoObject)
                        return false;
                    if (!this.kind)
                        return true;
                    var kind = safeGet (featureMember, 'GeoObject.metaDataProperty.GeocoderMetaData.kind', null);
                    return kind == this.kind;
                })
                .map (featureMember => {
                    return new YaGeoObject (featureMember.GeoObject);
                })
                .value ();

                resolve (this.results == 1 ? _.first (result) : result);

            });
        });
    }

    static query (input, results = 1) {
        return new MalibunPromise ((resolve, reject) => {
            HttpClient.forOptions ({
                url: 'https://geocode-maps.yandex.ru/1.x/',
                getParams: {
                    geocode: input.trim (),
                    results: results,
                    format: 'json'
                }
            }).execute ().then ((err, content, client) => {
                //console.log(client.getUrl());
                var response = safeGet (content, 'data.response', null);
                if (err || !response)
                    reject (err || new Error ('Не удалось получить ответ'));
                //console.log(content.content);
                var featureMembers = safeGet (response, 'GeoObjectCollection.featureMember', []);
                if (_.isEmpty (featureMembers))
                    resolve (null);
                var result = [];
                _.each (featureMembers, (featureMember) => {
                    var geoObject = safeGet (featureMember, 'GeoObject', null);
                    if (geoObject) {
                        result.push (new YaGeoObject (geoObject));
                    }
                });

                resolve (results === 1 ? _.first (result) : result);

            });
        });
    }


}