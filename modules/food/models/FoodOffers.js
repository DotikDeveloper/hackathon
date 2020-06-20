import {Schema} from 'mongoose';
import mongoose from 'mongoose';
import {validate as codeValidate} from "/modules/vmrunner";
import YaGeoObject from "../../geo/classes/YaGeoObject";
import _ from 'underscore';

const {
    SphericalUtil,
    PolyUtil
} = require ("node-geometry-library");

let PositionsSchema = new Schema ({
    lat: Number,
    long: Number,
    source: String
});

let GeoPointSchema = new Schema ({
    lat: Number,
    long: Number
});

let GeoRegionSchema = new Schema ({
    lowerCorner: GeoPointSchema,
    upperCorner: GeoPointSchema
});

/**
 * @constructor FoodOffers
 * @property {string} text Текст предложения
 * @property {string} images Ссылки на изображения
 * @property {object} data Дополнительные данные

 * @property {string} food_source_id Источник
 * @property {string} created Время создания
 * @property {string} expiries Время предложения
 * @property {string} link Ссылка на оригинал
 * @property {boolean} active Активно
 * @property {FoodSources} foodSource
 * @property {object[]} geoPoints
 * @property {object} exactGeo
 * @property {object[]} possibleGeos
 **/
const FoodOffersSchema = new Schema ({
    text: {
        type: String,
    },
    images: {
        type: [String],
    },
    data: {},

    food_source_id: {
        type: String,
        required: [true, 'Источник обязателен'],
    },
    created: {
        type: Date,
    },
    expiries: {
        type: Date,
    },
    link: {
        type: String
    },
    active: {
        type: Boolean,
        default () {
            return true;
        },
    },

    geoPoints: [PositionsSchema],
    exactGeo: {
        type: Schema.Types.Mixed,
        default: null
    },
    possibleGeos: [Schema.Types.Mixed],

});


FoodOffersSchema.virtual ('foodSource', {
    ref: 'foodSources',
    localField: 'food_source_id',
    foreignField: '_id',
    justOne: true,
    options: {}
});

FoodOffersSchema.methods.filterGeo = function (point, distance) {
    if (!point)
        return null;
    let region = this.region;
    if (!region)
        return false;
    const polygon = [{ //lowLeft
        lat: region.lowerCorner.lat,
        lng: region.lowerCorner.long
    },
        { //upLeft
            lat: region.upperCorner.lat,
            lng: region.lowerCorner.long
        },
        { //upRight
            lat: region.upperCorner.lat,
            lng: region.upperCorner.long
        },
        { //lowRight
            lat: region.lowerCorner.lat,
            lng: region.upperCorner.long
        }
    ];

    const $point = {
        lat: point.lat,
        lng: point.long
    };

    let response = PolyUtil.containsLocation ($point, polygon);

    if (response)
        return response;

    if (distance) {
        const distance1 = PolyUtil.distanceToLine ($point, // point object {lat, lng}
            polygon[0], // line start point object {lat, lng}
            polygon[1] // line endpoint object {lat, lng}
        );
        if ((distance1 / 1000) <= distance)
            return true;

        const distance2 = PolyUtil.distanceToLine ($point, // point object {lat, lng}
            polygon[1], // line start point object {lat, lng}
            polygon[2] // line endpoint object {lat, lng}
        );
        if ((distance2 / 1000) <= distance)
            return true;

        const distance3 = PolyUtil.distanceToLine ($point, // point object {lat, lng}
            polygon[2], // line start point object {lat, lng}
            polygon[3] // line endpoint object {lat, lng}
        );
        if ((distance3 / 1000) <= distance)
            return true;

        const distance4 = PolyUtil.distanceToLine ($point, // point object {lat, lng}
            polygon[3], // line start point object {lat, lng}
            polygon[0] // line endpoint object {lat, lng}
        );
        if ((distance4 / 1000) <= distance)
            return true;
    }

};

FoodOffersSchema.virtual ('point').get (function () {
    if (this.exactGeo) {
        let geo = new YaGeoObject (this.exactGeo);
        return geo.point;
    }
    if (!_.isEmpty (this.possibleGeos)) {
        let geo = new YaGeoObject (_.first (this.possibleGeos));
        return geo.point;
    }
    return null;
});

FoodOffersSchema.virtual ('region').get (function () {
    if (this.exactGeo) {
        let geo = new YaGeoObject (this.exactGeo);
        return geo.region;
    }
    if (!_.isEmpty (this.possibleGeos)) {
        let geo = new YaGeoObject (_.first (this.possibleGeos));
        return geo.region;
    }
    return null;
});

FoodOffersSchema.virtual ('address').get (function () {
    if (this.exactGeo) {
        let geo = new YaGeoObject (this.exactGeo);
        return geo.text;
    }
    if (!_.isEmpty (this.possibleGeos)) {
        let geo = new YaGeoObject (_.first (this.possibleGeos));
        return geo.text;
    }
    return null;
});


const FoodOffers = new mongoose.model ('foodOffers', FoodOffersSchema, 'foodOffers');
FoodOffers.label = 'Предложения';
export default FoodOffers;