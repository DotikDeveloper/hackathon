import Enum from '/lib/Enum';

/**
 * @name LogLevels
 * @extends Enum
 * @property {object} error
 * @property {string} error.key
 * @property {string} error.value
 * @property {object} warn
 * @property {string} warn.key
 * @property {string} warn.value
 * @property {object} info
 * @property {string} info.key
 * @property {string} info.value
 * @property {object} http
 * @property {string} http.key
 * @property {string} http.value
 * @property {object} verbose
 * @property {string} verbose.key
 * @property {string} verbose.value
 * @property {object} debug
 * @property {string} debug.key
 * @property {string} debug.value
 * @property {object} silly
 * @property {string} silly.key
 * @property {string} silly.value
 **/
/**@type LogLevels*/
const LogLevels = new Enum({
    'error':'error',
    'warn':'warn',
    'info':'info',
    'http':'http',
    'verbose':'verbose',
    'debug':'debug',
    'silly':'silly',
});

/**
 * @name Tags
 * @extends Enum
 * @property {EnumItem} ami
 * @property {EnumItem} agi
 * @property {EnumItem} system
 * @property {EnumItem} menu
 **/
/**@type Tags*/
const Tags = new Enum({
    ami:'AMI',
    agi:'AGI',
    system:'Система',
    menu:'Меню'
});

export {
    LogLevels,Tags
}