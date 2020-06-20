import {get as safeGet} from "lodash";
import _ from "underscore";

export default class YaGeoObject {
    constructor (data) {
        this.data = data;
    }

    get request () {
        return safeGet (this.data, 'metaDataProperty.GeocoderMetaData.text', null);
    }

    get adress () {
        return safeGet (this.data, 'metaDataProperty.GeocoderMetaData.Address.Components', null);
    }

    get details () {
        return safeGet (this.data, 'metaDataProperty.GeocoderMetaData.AddressDetails.Country', null);
    }

    get locality () {
        return safeGet (this.details, 'AdministrativeArea.SubAdministrativeArea.Locality', null);
    }

    get country_code(){
        return this.data?.metaDataProperty?.GeocoderMetaData?.Address?.country_code;
    }

    get cityName () {
        var adress = this.adress;
        if (!adress)
            return null;
        var cityItem = _.find (adress, (aItem) => {
            return aItem.kind == "locality";
        });
        return safeGet (cityItem, 'name', null);
    }

    get text(){
        return safeGet(this.data,'metaDataProperty.GeocoderMetaData.text')
    }

    normalizeCoords (pos) {
        if (!_.isString (pos))
            return null;
        let coords =  _.chain (pos.split (' '))
        .map (Number)
        .value ();
        return {
            long: coords[0],
            lat: coords[1],

        }
    }

    /**@returns {GeoPoint}*/
    get point () {
        let pos = safeGet (this.data, 'Point.pos', null);
        return this.normalizeCoords(pos);
    }

    /**@returns {GeoRegion}*/
    get region () {
        let envelope = safeGet (this.data, 'boundedBy.Envelope');
        if (envelope && envelope.lowerCorner) {
            return {
                lowerCorner:this.normalizeCoords(envelope.lowerCorner),
                upperCorner:this.normalizeCoords(envelope.upperCorner),
            }
        }
    }

    get kind(){
        return safeGet(this.data,'metaDataProperty.GeocoderMetaData.kind',null);
    }

    /**@param {GeoPoint} point*/
    getDistance(point){
        function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
            var R = 6371; // Radius of the earth in km
            var dLat = deg2rad(lat2-lat1);  // deg2rad below
            var dLon = deg2rad(lon2-lon1);
            var a =
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2)
            ;
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            var d = R * c; // Distance in km
            return d;
        }

        function deg2rad(deg) {
            return deg * (Math.PI/180)
        }
        let thisPoint = this.point;
        return getDistanceFromLatLonInKm(thisPoint.lat,thisPoint.long,point.lat,point.long);
    }
}