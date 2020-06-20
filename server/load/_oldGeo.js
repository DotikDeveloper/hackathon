import '/modules/logger';
import './export';

import _ from 'underscore';
import KladrStreets from "../../modules/geo/models/KladrStreets";
import YaGeoCoder from "../../modules/geo/classes/YaGeoCoder";
const md5 = require('md5');

const Morphy = require('phpmorphy');
const morphy = new Morphy('ru');
const NodeCache = require( 'node-cache' );

const morphCache = new NodeCache({
    stdTTL:5*60,
    checkperiod:60,
    useClones:true,
    deleteOnExpire:true
});

const morphyCached = new Proxy(morphy,{
    get(target, property) {
        let val = target[property];
        if(_.isFunction(val)){
            return function(){
                let hash = `${property}:${md5( JSON.stringify(arguments) ) }`;
                let result = morphCache.get( hash );
                if( result!==undefined ){
                    return result;
                }
                result = val.apply(target,arguments);
                morphCache.set(hash,result);
                return result;
            }
        }
        return val;
    },
});

//return morphy.getGramInfoMergeForms('Зорге'.toUpperCase(), Morphy.NORMAL);

const GENDERS = ['МР', 'ЖР', 'СР'];

function compareGenders(word1, word2) {
    let genders1 = _.chain(morphyCached.getGramInfoMergeForms(word1.toUpperCase(), Morphy.NORMAL))
    .pluck('grammems')
    .flatten()
    .filter((gram) => {
        return GENDERS.indexOf(gram) > -1;
    })
    .value();
    let genders2 = _.chain(morphyCached.getGramInfoMergeForms(word2.toUpperCase(), Morphy.NORMAL))
    .pluck('grammems')
    .flatten()
    .filter((gram) => {
        return GENDERS.indexOf(gram) > -1;
    })
    .value();
    if (_.isEmpty(genders1) && _.isEmpty(genders2))
        return true;
    return !_.isEmpty(_.intersection(genders1, genders2));

}


const natural = require('natural');
const tokenizer = new natural.AggressiveTokenizerRu({
    language: "ru"
});
const provider = morphy.getGrammemsProvider();

let text = `

м.Владимирская,Маяковская 5 минут. Сегодня РОВНО в 11.30-12.00 жду одного спасателя со своим пакетом за вкусным и свежим хлебом от нашего замечательного тайного партнёра и от прекрасной пекарни "Пуд хлеба".
Приоритет не бравшим хлеб в течение недели.
Запись под постом. Не отвечаете на сообщение и не подтверждаете бронь - передаю другому. ЛС закрыта- передаю другому.
Не опаздываем. РАНЬШЕ НЕ ПРИХОДИМ!
`;

