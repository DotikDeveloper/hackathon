import _ from 'underscore';
import KladrStreets from "/modules/geo/models/KladrStreets";
import YaGeoCoder from "/modules/geo/classes/YaGeoCoder";

const md5 = require ('md5');
const natural = require ('natural');
const tokenizer = new natural.AggressiveTokenizerRu ({
    language: "ru"
});

const Morphy = require ('phpmorphy');
const morphy = new Morphy ('ru');
const NodeCache = require ('node-cache');
const provider = morphy.getGrammemsProvider ();
const morphCache = new NodeCache ({
    stdTTL: 5 * 60,
    checkperiod: 60,
    useClones: true,
    deleteOnExpire: true
});

const morphyCached = new Proxy (morphy, {
    get (target, property) {
        let val = target[property];
        if (_.isFunction (val)) {
            return function () {
                let hash = `${property}:${md5 (JSON.stringify (arguments))}`;
                let result = morphCache.get (hash);
                if (result !== undefined) {
                    return result;
                }
                result = val.apply (target, arguments);
                morphCache.set (hash, result);
                return result;
            }
        }
        return val;
    },
});

const GENDERS = ['МР', 'ЖР', 'СР'];

function compareGenders (word1, word2) {
    let genders1 = _.chain (morphyCached.getGramInfoMergeForms (word1.toUpperCase (), Morphy.NORMAL))
    .pluck ('grammems')
    .flatten ()
    .filter ((gram) => {
        return GENDERS.indexOf (gram) > -1;
    })
    .value ();
    let genders2 = _.chain (morphyCached.getGramInfoMergeForms (word2.toUpperCase (), Morphy.NORMAL))
    .pluck ('grammems')
    .flatten ()
    .filter ((gram) => {
        return GENDERS.indexOf (gram) > -1;
    })
    .value ();
    if (_.isEmpty (genders1) && _.isEmpty (genders2))
        return true;
    return !_.isEmpty (_.intersection (genders1, genders2));

}


export default class GeoContext {
    constructor () {
        this.regionNames = [];
    }

    /**@returns {this}*/
    withRegionNames (names) {
        this.regionNames = names;
        return this;
    }

    async getYaRegions () {
        if (_.isEmpty (this.regionNames))
            return [];
        return _.mapAsync (this.regionNames, async (regionName) => {
            const geoCoder = new YaGeoCoder ();
            geoCoder.results = 1;
            return await geoCoder.query (regionName)
        });
    }


    async parseGeos (text) {
        const textTokens = tokenizer.tokenize (text);
        let nodes = _.chain (textTokens)
        .map ((word) => {
            let lemmas = morphyCached.lemmatize (word.toUpperCase (), Morphy.NORMAL);
            return {
                word,
                lemmas: lemmas || []
            }
        })
        .compact ()
        .flatten ()
        .uniq ()
        .value ();



        _.each (nodes, (node, index) => {
            node.next = () => {
                if (nodes[index + 1])
                    return nodes[index + 1];
            };
            node.previos = () => {
                if (nodes[index - 1])
                    return nodes[index - 1];
            };
        });


        let chunks = await _.mapAsync (nodes, async ($node) => {
            if ($node.word.length < 3 || _.isEmpty ($node.lemmas))
                return;
            let streets = await KladrStreets.find ({
                lemmas: {
                    $in: $node.lemmas
                }
            });
            let $pathes = morphyCached.getPartOfSpeech ($node.word.toUpperCase ());

            let includedStreets = _.filter (streets, (street) => {
                let words = tokenizer.tokenize (street.name);
                let finded = _.find (words, (word) => {
                    let pathes = morphyCached.getPartOfSpeech (word.toUpperCase ());
                    let pathIntersections = _.intersection (pathes, $pathes);
                    if (!_.isEmpty (pathIntersections) && compareGenders ($node.word, word)) {
                        let variants = morphyCached.castFormByPattern (word.toUpperCase (), $node.word.toUpperCase (), provider, true);
                        let intersect = _.intersection (variants, [$node.word.toUpperCase ()]);
                        return !_.isEmpty (intersect);
                    }
                });
                return finded;
            });

            let excludedStreets = _.difference (streets, includedStreets);
            if (_.isEmpty (streets))
                return null;
            return {
                node: $node,
                chunk: $node.word,
                includedStreets: _.pluck (includedStreets, 'name'),
                excludedStreets: _.pluck (excludedStreets, 'name'),
            }
        });
        chunks = _.compact (chunks);

        let ctxYaRegions = await this.getYaRegions ();

        /**@param {YaGeoObject} geo*/
        function minDistance (geo) {
            let distances = _.map (ctxYaRegions, (regionYaGeo) => {
                return geo.getDistance (regionYaGeo.point);
            });
            return _.min (distances);
        }

        /**@param {YaGeoObject} geo*/
        function inCtxRegions (geo) {

            let point = geo.point;
            let matchedRegion = _.find (ctxYaRegions, (yaRegionGeo) => {
                const region = yaRegionGeo.region;
                if(!region)
                    return false;
                try {
                    return (
                        region.lowerCorner.lat <= point.lat && region.upperCorner.lat >= point.lat
                        && region.lowerCorner.long <= point.long && region.upperCorner.long >= point.long
                    )
                } catch (e) {
                    console.log ('geo', JSON.stringify (geo.data));
                    console.log ('yaRegionGeo', JSON.stringify (geo.data));
                    console.error (e);
                }
            });
            return !!matchedRegion;

        }

        let queries = await _.mapAsync (chunks, (chunk) => {
            let prevNode = chunk.node.previos ();
            let nexNode = chunk.node.next ();

            let query1 = _.chain ([prevNode, chunk.node, nexNode])
            .compact ()
            .pluck ('word')
            .value ()
            .join (' ');

            let queries = [query1];
            if (/^[А-Я]/.test (chunk.node.word)) {
                queries.push (chunk.node.word);
            }
            if (prevNode || nexNode) {
                let query2 = _.chain ([prevNode ? prevNode.previos () : null, prevNode, chunk.node, nexNode, nexNode ? nexNode.next () : null])
                .compact ()
                .pluck ('word')
                .value ()
                .join (' ');
                queries.push (query2)
            }


            return queries;

        });

        queries = _.flatten (queries);

        function getRank (geo) {
            let placeTypeData ={
                'house':8, 'street':6, 'metro':5, 'district':2, 'locality':1, 'railway_station':0, 'vegetation':2, 'entrance':10
            };
            let placeTypeRank = placeTypeData[geo.kind]||0;

            var distanceRank = 0;
            if (!_.isEmpty (ctxYaRegions)){
                let distance = minDistance (geo);
                if(distance<3)
                    distanceRank=5;
                else if(distance<5)
                    distanceRank=3;
                else if(distance<10)
                    distanceRank=2;
            }

            let addressTokens = tokenizer.tokenize(geo.text);
            let intersect = _.intersection(addressTokens,textTokens);

            return _.reduce([
                placeTypeRank,distanceRank,intersect.length*3
            ], function(memo, num){ return memo + num; }, 0);
        }

        let geos = await _.mapAsync (queries, async (query) => {
            try {
                const geoCoder = new YaGeoCoder ();
                geoCoder.results = 20;
                let geos = await geoCoder.query (query);
                if (!_.isEmpty (geos)) {
                    geos = _.chain (geos)
                    .filter (/**@param {YaGeoObject} geo*/ (geo) => {
                        return geo.country_code == 'RU' && [
                            'house', 'street', 'metro', 'district', 'locality', 'railway_station', 'vegetation', 'entrance'
                        ].indexOf (geo.kind) > -1
                    })
                    .filter (/**@param {YaGeoObject} geo*/ (geo) => {
                        if (_.isEmpty (ctxYaRegions))
                            return true;
                        return inCtxRegions (geo);
                    })
                    .unique((geo)=>{
                        return geo.text;
                    })
                    .sortBy ((geo)=>{
                        return -getRank(geo)
                    })
                    .first (10)
                    .value ();

                    return geos;
                }
            } catch (e) {
                console.error (e);
            }

        });

        geos = _.chain (geos)
        .flatten ()
        .compact ()
        .unique((geo)=>{
            return geo.text;
        })
        .sortBy ((geo)=>{
            return -getRank(geo)
        })
        .first (10)
        .value ();

        return geos;
    }

}