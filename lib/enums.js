import Enum from '/lib/Enum';

/**@type FILTER_MODE*/
const FILTER_MODE = new Enum({
    variable: 'Переменная',
    expression: 'Выражение',
    value:'Значение'
});

/**
 * @name FIELD_BUILDER_TYPE
 * @extends Enum
 * @property {EnumItem} string
 * @property {EnumItem} integer
 * @property {EnumItem} double
 * @property {EnumItem} boolean
 * @property {EnumItem} date
 * @property {EnumItem} datetime
 **/
const FIELD_BUILDER_TYPE = new Enum({
    'string':'Строка',
    'integer':'Целое число',
    'double':'Дробное число',
    'boolean':'Логический тип',
    'date':'Дата',
    'datetime':'Дата+Время',
});

/**
 * @name FIELD_CALLS_TYPE
 * @extends Enum
 * @property {EnumItem} String
 * @property {EnumItem} Number
 * @property {EnumItem} Phone
 * @property {EnumItem} Date
 * @property {EnumItem} Address
 **/
const FIELD_CALLS_TYPE = new Enum({
    String:'Строка',
    Number:'Число',
    Phone:'Телефон',
    Date:'Дата',
    Address:'Адрес'
});

/**
 * @name ENCODINGS
 * @extends Enum
 * @property {EnumItem} utf8
 * @property {EnumItem} win1251
 * @property {EnumItem} cp866
 **/
const ENCODINGS = new Enum({
    utf8:'UTF-8',
    win1251:'Windows-1251',
    cp866:'CP-866'
});

/**
 * @name FILE_TYPES
 * @extends Enum
 * @property {EnumItem} csv
 * @property {EnumItem} dbf
 * @property {EnumItem} xlsx
 * */
const FILE_TYPES = new Enum({
    csv:'CSV',
    dbf:'DBF',
    xlsx:'XLSX',
});

export {
    FILTER_MODE,FIELD_BUILDER_TYPE,FIELD_CALLS_TYPE,ENCODINGS,FILE_TYPES
}