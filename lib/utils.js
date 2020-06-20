import moment from 'moment-timezone';
import EJSON from 'ejson';
import _ from 'underscore';

function formatDate(date,format){
    return moment(date).tz('Europe/Moscow').format(format);
}

function formatRuDateTime(date) {
    if(!date)
        return 'Не определено';
    return moment(date).tz('Europe/Moscow').format('YYYY-MM-DD HH:mm:ss');
}

function formatBoolean(bool){
    return bool?'Да':'Нет';
}

function formatRuDateTimeMS(date) {
    if(!date)
        return 'Не определено';
    return moment(date).tz('Europe/Moscow').format('YYYY-MM-DD HH:mm:ss SSS');
}

function formatRuDate(date) {
    if(!date)
        return 'Не определено';
    return moment(date).tz('Europe/Moscow').format('YYYY-MM-DD');
}

function inDateRange(date,dateFrom,dateTo){
    if((dateFrom&&date)&&dateFrom.getTime()>date.getTime())
        return false;
    return !(dateTo && date && dateTo.getTime () < date.getTime ());

}

function graphqlClone(obj,keysToRemove){
    let result = EJSON.clone(obj);
    delete result.__typename;
    if(keysToRemove){
        if(!_.isArray(keysToRemove))
            keysToRemove = [keysToRemove];
        _.each(keysToRemove,(keyToRemove)=>{
             delete result[keyToRemove];
        });
    }
    return result;
}

function mongooseObjectId () {
    return hex(Date.now() / 1000) +
        ' '.repeat(16).replace(/./g, () => hex(Math.random() * 16))
}

function hex (value) {
    return Math.floor(value).toString(16)
}

export {
    formatDate,
    formatRuDateTime,
    formatRuDateTimeMS,
    formatRuDate,
    inDateRange,
    graphqlClone,
    formatBoolean,
    mongooseObjectId
}