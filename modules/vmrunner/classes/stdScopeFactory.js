import {formatRuDate, formatRuDateTime} from "../../../lib/utils";
import {isset} from "../../../server/lib/utils";
import _ from 'underscore';
import {get as safeGet} from 'lodash';
import md5 from 'md5';
import HttpClient from "../../../server/lib/HttpClient";
import moment from 'moment';
import _require from 'native-require';

export default function () {
    return {
        formatRuDateTime,
        formatRuDate,
        _,
        safeGet,
        isset,
        moment,
        HttpClient,
        Object,
        //Function,
        Array,
        Number,
        parseFloat,
        parseInt,
        'Infinity':  Infinity ,
        'NaN':  NaN ,
        'undefined': void 0,
        'Boolean': Boolean ,
        'String':  String ,
        'Symbol': Symbol,
        'Date':Date ,
        'Promise':Promise,
        'RegExp': RegExp,
        'Error': Error,
        'EvalError': EvalError,
        'RangeError': RangeError,
        'ReferenceError': ReferenceError,
        'SyntaxError': SyntaxError,
        'TypeError': TypeError,
        'URIError': URIError,
        'JSON': JSON,
        'Math':Math,
        'console': console,
        'Intl': Intl,
        'ArrayBuffer': ArrayBuffer ,
        'Uint8Array':Uint8Array,
        'Int8Array': Int8Array,
        'Uint16Array': Uint16Array,
        'Int16Array': Int16Array,
        'Uint32Array': Uint32Array,
        'Int32Array': Int32Array,
        'Float32Array': Float32Array,
        'Float64Array':Float64Array,
        'Uint8ClampedArray': Uint8ClampedArray,
        'DataView': DataView,
        'Map': Map,
        'Set': Set,
        'WeakMap': WeakMap,
        'WeakSet': WeakSet,
        'Proxy': Proxy,
        'Reflect': Reflect,
        'decodeURI': decodeURI,
        'decodeURIComponent': decodeURIComponent,
        'encodeURI': encodeURI,
        'encodeURIComponent': encodeURIComponent,
        'escape': escape,
        'unescape': unescape,
        'isFinite': isFinite,
        'isNaN': isNaN,
        'WebAssembly': WebAssembly,
        'Buffer': Buffer,
        'clearImmediate': clearImmediate,
        'clearInterval': clearInterval,
        'clearTimeout': clearTimeout,
        'setImmediate': setImmediate,
        'setInterval': setInterval,
        'setTimeout': setTimeout,
        md5,
        require:_require,//?
    }
}