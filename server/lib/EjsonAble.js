function hasOwn(obj, prop) {
    return {}.hasOwnProperty.call(obj, prop);
}

function isArguments(obj) {
    return obj != null && hasOwn(obj, 'callee');
}

function quote(string) {
    return JSON.stringify(string);
}

function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
        _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
    } return _typeof(obj);
}

function isInfOrNan(obj) {
    return Number.isNaN(obj) || obj === Infinity || obj === -Infinity;
}

const BASE_64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const BASE_64_VALS = Object.create(null);

function getChar(val) {
    return BASE_64_CHARS.charAt(val);
}

function getVal(ch) {
    return ch === '=' ? -1 : BASE_64_VALS[ch];
}

for (var i = 0; i < BASE_64_CHARS.length; i++) {
    BASE_64_VALS[getChar(i)] = i;
}


function str(key, holder, singleIndent, outerIndent, canonical) {
    var value = holder[key]; // What happens next depends on the value's type.

    switch (_typeof(value)) {
        case 'string':
            return quote(value);

        case 'number':
            // JSON numbers must be finite. Encode non-finite numbers as null.
            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
            return String(value);
        // If the type is 'object', we might be dealing with an object or an array or
        // null.

        case 'object':
        {
            // Due to a specification blunder in ECMAScript, typeof null is 'object',
            // so watch out for that case.
            if (!value) {
                return 'null';
            } // Make an array to hold the partial results of stringifying this object
            // value.


            var innerIndent = outerIndent + singleIndent;
            var partial = [];
            var v; // Is the value an array?

            if (Array.isArray(value) || {}.hasOwnProperty.call(value, 'callee')) {
                // The value is an array. Stringify every element. Use null as a
                // placeholder for non-JSON values.
                var length = value.length;

                for (var i = 0; i < length; i += 1) {
                    partial[i] = str(i, value, singleIndent, innerIndent, canonical) || 'null';
                } // Join all of the elements together, separated with commas, and wrap
                // them in brackets.


                if (partial.length === 0) {
                    v = '[]';
                } else if (innerIndent) {
                    v = '[\n' + innerIndent + partial.join(',\n' + innerIndent) + '\n' + outerIndent + ']';
                } else {
                    v = '[' + partial.join(',') + ']';
                }

                return v;
            } // Iterate through all of the keys in the object.


            var keys = Object.keys(value);

            if (canonical) {
                keys = keys.sort();
            }

            keys.forEach(function (k) {
                v = str(k, value, singleIndent, innerIndent, canonical);

                if (v) {
                    partial.push(quote(k) + (innerIndent ? ': ' : ':') + v);
                }
            }); // Join all of the member texts together, separated with commas,
            // and wrap them in braces.

            if (partial.length === 0) {
                v = '{}';
            } else if (innerIndent) {
                v = '{\n' + innerIndent + partial.join(',\n' + innerIndent) + '\n' + outerIndent + '}';
            } else {
                v = '{' + partial.join(',') + '}';
            }

            return v;
        }

        default: // Do nothing

    }
}

function encode(array) {
    if (typeof array === "string") {
        var str = array;
        array = newBinary(str.length);

        for (var _i = 0; _i < str.length; _i++) {
            var ch = str.charCodeAt(_i);

            if (ch > 0xFF) {
                throw new Error("Not ascii. Base64.encode can only take ascii strings.");
            }

            array[_i] = ch;
        }
    }

    var answer = [];
    var a = null;
    var b = null;
    var c = null;
    var d = null;
    array.forEach(function (elm, i) {
        switch (i % 3) {
            case 0:
                a = elm >> 2 & 0x3F;
                b = (elm & 0x03) << 4;
                break;

            case 1:
                b = b | elm >> 4 & 0xF;
                c = (elm & 0xF) << 2;
                break;

            case 2:
                c = c | elm >> 6 & 0x03;
                d = elm & 0x3F;
                answer.push(getChar(a));
                answer.push(getChar(b));
                answer.push(getChar(c));
                answer.push(getChar(d));
                a = null;
                b = null;
                c = null;
                d = null;
                break;
        }
    });

    if (a != null) {
        answer.push(getChar(a));
        answer.push(getChar(b));

        if (c == null) {
            answer.push('=');
        } else {
            answer.push(getChar(c));
        }

        if (d == null) {
            answer.push('=');
        }
    }

    return answer.join("");
}


function newBinary(len) {
    if (typeof Uint8Array === 'undefined' || typeof ArrayBuffer === 'undefined') {
        var ret = [];

        for (var _i2 = 0; _i2 < len; _i2++) {
            ret.push(0);
        }

        ret.$Uint8ArrayPolyfill = true;
        return ret;
    }

    return new Uint8Array(new ArrayBuffer(len));
}

function decode(str) {
    var len = Math.floor(str.length * 3 / 4);

    if (str.charAt(str.length - 1) == '=') {
        len--;

        if (str.charAt(str.length - 2) == '=') {
            len--;
        }
    }

    var arr = newBinary(len);
    var one = null;
    var two = null;
    var three = null;
    var j = 0;

    for (var _i3 = 0; _i3 < str.length; _i3++) {
        var c = str.charAt(_i3);
        var v = getVal(c);

        switch (_i3 % 4) {
            case 0:
                if (v < 0) {
                    throw new Error('invalid base64 string');
                }

                one = v << 2;
                break;

            case 1:
                if (v < 0) {
                    throw new Error('invalid base64 string');
                }

                one = one | v >> 4;
                arr[j++] = one;
                two = (v & 0x0F) << 4;
                break;

            case 2:
                if (v >= 0) {
                    two = two | v >> 2;
                    arr[j++] = two;
                    three = (v & 0x03) << 6;
                }

                break;

            case 3:
                if (v >= 0) {
                    arr[j++] = three | v;
                }

                break;
        }
    }

    return arr;
}

const Base64 = {
    encode: encode,
    decode: decode,
    newBinary: newBinary
}

function canonicalStringify(value, options) {
    // Make a fake root object containing our value under the key of ''.
    // Return the result of stringifying the value.
    var allOptions = Object.assign({
        indent: '',
        canonical: false
    }, options);

    if (allOptions.indent === true) {
        allOptions.indent = '  ';
    } else if (typeof allOptions.indent === 'number') {
        var newIndent = '';

        for (var i = 0; i < allOptions.indent; i++) {
            newIndent += ' ';
        }

        allOptions.indent = newIndent;
    }

    return str('', {
        '': value
    }, allOptions.indent, '', allOptions.canonical);
}

export default class EjsonAble {
    constructor () {
        const ejson = this;
        const customTypes = this.customTypes = {};
        const builtinConverters = this.builtinConverters = [{
            // Date
            matchJSONValue: function matchJSONValue(obj) {
                return hasOwn(obj, '$date') && Object.keys(obj).length === 1;
            },
            matchObject: function matchObject(obj) {
                return obj instanceof Date;
            },
            toJSONValue: function toJSONValue(obj) {
                return {
                    $date: obj.getTime()
                };
            },
            fromJSONValue: function fromJSONValue(obj) {
                return new Date(obj.$date);
            }
        }, {
            // RegExp
            matchJSONValue: function matchJSONValue(obj) {
                return hasOwn(obj, '$regexp') && hasOwn(obj, '$flags') && Object.keys(obj).length === 2;
            },
            matchObject: function matchObject(obj) {
                return obj instanceof RegExp;
            },
            toJSONValue: function toJSONValue(regexp) {
                return {
                    $regexp: regexp.source,
                    $flags: regexp.flags
                };
            },
            fromJSONValue: function fromJSONValue(obj) {
                // Replaces duplicate / invalid flags.
                return new RegExp(obj.$regexp, obj.$flags // Cut off flags at 50 chars to avoid abusing RegExp for DOS.
                .slice(0, 50).replace(/[^gimuy]/g, '').replace(/(.)(?=.*\1)/g, ''));
            }
        }, {
            // NaN, Inf, -Inf. (These are the only objects with typeof !== 'object'
            // which we match.)
            matchJSONValue: function matchJSONValue(obj) {
                return hasOwn(obj, '$InfNaN') && Object.keys(obj).length === 1;
            },
            matchObject: isInfOrNan,
            toJSONValue: function toJSONValue(obj) {
                var sign;

                if (Number.isNaN(obj)) {
                    sign = 0;
                } else if (obj === Infinity) {
                    sign = 1;
                } else {
                    sign = -1;
                }

                return {
                    $InfNaN: sign
                };
            },
            fromJSONValue: function fromJSONValue(obj) {
                return obj.$InfNaN / 0;
            }
        }, {
            // Binary
            matchJSONValue: function matchJSONValue(obj) {
                return hasOwn(obj, '$binary') && Object.keys(obj).length === 1;
            },
            matchObject: function matchObject(obj) {
                return typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array || obj && hasOwn(obj, '$Uint8ArrayPolyfill');
            },
            toJSONValue: function toJSONValue(obj) {
                return {
                    $binary: Base64.encode(obj)
                };
            },
            fromJSONValue: function fromJSONValue(obj) {
                return Base64.decode(obj.$binary);
            }
        }, {
            // Escaping one level
            matchJSONValue: function matchJSONValue(obj) {
                return hasOwn(obj, '$escape') && Object.keys(obj).length === 1;
            },
            matchObject: function matchObject(obj) {
                var match = false;

                if (obj) {
                    var keyCount = Object.keys(obj).length;

                    if (keyCount === 1 || keyCount === 2) {
                        match = builtinConverters.some(function (converter) {
                            return converter.matchJSONValue(obj);
                        });
                    }
                }

                return match;
            },
            toJSONValue: function toJSONValue(obj) {
                var newObj = {};
                Object.keys(obj).forEach(function (key) {
                    newObj[key] = ejson.toJSONValue(obj[key]);
                });
                return {
                    $escape: newObj
                };
            },
            fromJSONValue: function fromJSONValue(obj) {
                var newObj = {};
                Object.keys(obj.$escape).forEach(function (key) {
                    newObj[key] = ejson.fromJSONValue(obj.$escape[key]);
                });
                return newObj;
            }
        }, {
            // Custom
            matchJSONValue: function matchJSONValue(obj) {
                return hasOwn(obj, '$type') && hasOwn(obj, '$value') && Object.keys(obj).length === 2;
            },
            matchObject: function matchObject(obj) {
                return ejson._isCustomType(obj);
            },
            toJSONValue: function toJSONValue(obj) {
                var jsonValue = obj.toJSONValue();

                return {
                    $type: obj.typeName(),
                    $value: jsonValue
                };
            },
            fromJSONValue: function fromJSONValue(obj) {
                var typeName = obj.$type;
                if (!hasOwn(customTypes, typeName)) {
                    throw new Error("Custom EJSON type ".concat(typeName, " is not defined"));
                }
                var converter = customTypes[typeName];
                return (function () {
                    return converter(obj.$value);
                })();
            }
        }];
    }

    fromJSONValueHelper(value) {
        if (_typeof(value) === 'object' && value !== null) {
            var keys = Object.keys(value);

            if (keys.length <= 2 && keys.every(function (k) {
                return typeof k === 'string' && k.substr(0, 1) === '$';
            })) {
                for (var i = 0; i < this.builtinConverters.length; i++) {
                    var converter = this.builtinConverters[i];

                    if (converter.matchJSONValue(value)) {
                        return converter.fromJSONValue(value);
                    }
                }
            }
        }
        return value;
    }

    addType(name, factory) {
        if (hasOwn(this.customTypes, name)) {
            throw new Error("Type ".concat(name, " already present"));
        }
        this.customTypes[name] = factory;
    }

    _isCustomType(obj) {
        return obj && typeof obj.toJSONValue === 'function' && typeof obj.typeName === 'function' && hasOwn(this.customTypes, obj.typeName());
    }

    _getTypes() {
        return this.customTypes;
    }

    _getConverters() {
        return this.builtinConverters;
    }

    adjustTypesFromJSONValue(obj) {
        if (obj === null) {
            return null;
        }

        var maybeChanged = this.fromJSONValueHelper(obj);

        if (maybeChanged !== obj) {
            return maybeChanged;
        } // Other atoms are unchanged.


        if (_typeof(obj) !== 'object') {
            return obj;
        }

        Object.keys(obj).forEach( (key)=> {
            var value = obj[key];

            if (_typeof(value) === 'object') {
                var changed = this.fromJSONValueHelper(value);

                if (value !== changed) {
                    obj[key] = changed;
                    return;
                } // if we get here, value is an object but not adjustable
                // at this level.  recurse.


                this.adjustTypesFromJSONValue(value);
            }
        });
        return obj;
    }

    _adjustTypesToJSONValue(obj) {
        if (obj === null) {
            return null;
        }

        const maybeChanged = this.fromJSONValueHelper (obj);

        if (maybeChanged !== obj) {
            return maybeChanged;
        }


        if (_typeof(obj) !== 'object') {
            return obj;
        }

        Object.keys(obj).forEach( (key)=> {
            var value = obj[key];

            if (_typeof(value) === 'object') {
                var changed = this.fromJSONValueHelper(value);

                if (value !== changed) {
                    obj[key] = changed;
                    return;
                } // if we get here, value is an object but not adjustable
                // at this level.  recurse.


                this.adjustTypesFromJSONValue(value);
            }
        });
        return obj;
    }

    toJSONValue(item) {
        const toJSONValueHelper=(item)=>{
            for (var i = 0; i < this.builtinConverters.length; i++) {
                var converter = this.builtinConverters[i];
                if (converter.matchObject(item)) {
                    return converter.toJSONValue(item);
                }
            }
            return undefined;
        }

        var changed = toJSONValueHelper(item);

        if (changed !== undefined) {
            return changed;
        }

        var newItem = item;

        if (_typeof(item) === 'object') {
            newItem = this.clone(item);
            this._adjustTypesToJSONValue(newItem);
        }

        return newItem;
    }

    fromJSONValue(item) {
        var changed = this.fromJSONValueHelper(item);

        if (changed === item && _typeof(item) === 'object') {
            changed = this.clone(item);
            this.adjustTypesFromJSONValue(changed);
        }

        return changed;
    }

    stringify(item, options) {
        var serialized;
        var json = this.toJSONValue(item);

        if (options && (options.canonical || options.indent)) {
            serialized = canonicalStringify(json, options);
        } else {
            serialized = JSON.stringify(json);
        }

        return serialized;
    }

    parse(item) {
        if (typeof item !== 'string') {
            throw new Error('EJSON.parse argument should be a string');
        }

        return this.fromJSONValue(JSON.parse(item));
    }

    isBinary (obj) {
        return !!(typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array || obj && obj.$Uint8ArrayPolyfill);
    }

    equals(a, b, options) {
        const ejson = this;
        var i;
        var keyOrderSensitive = !!(options && options.keyOrderSensitive);

        if (a === b) {
            return true;
        } // This differs from the IEEE spec for NaN equality, b/c we don't want
        // anything ever with a NaN to be poisoned from becoming equal to anything.


        if (Number.isNaN(a) && Number.isNaN(b)) {
            return true;
        } // if either one is falsy, they'd have to be === to be equal


        if (!a || !b) {
            return false;
        }

        if (!(_typeof(a) === 'object' && _typeof(b) === 'object')) {
            return false;
        }

        if (a instanceof Date && b instanceof Date) {
            return a.valueOf() === b.valueOf();
        }

        if (this.isBinary(a) && this.isBinary(b)) {
            if (a.length !== b.length) {
                return false;
            }

            for (i = 0; i < a.length; i++) {
                if (a[i] !== b[i]) {
                    return false;
                }
            }

            return true;
        }

        if (typeof a.equals === 'function') {
            return a.equals(b, options);
        }

        if (typeof b.equals === 'function') {
            return b.equals(a, options);
        }

        if (a instanceof Array) {
            if (!(b instanceof Array)) {
                return false;
            }

            if (a.length !== b.length) {
                return false;
            }

            for (i = 0; i < a.length; i++) {
                if (!ejson.equals(a[i], b[i], options)) {
                    return false;
                }
            }

            return true;
        } // fallback for custom types that don't implement their own equals


        switch (ejson._isCustomType(a) + ejson._isCustomType(b)) {
            case 1:
                return false;

            case 2:
                return ejson.equals(ejson.toJSONValue(a), ejson.toJSONValue(b));

            default: // Do nothing

        } // fall back to structural equality of objects


        var ret;
        var aKeys = Object.keys(a);
        var bKeys = Object.keys(b);

        if (keyOrderSensitive) {
            i = 0;
            ret = aKeys.every(function (key) {
                if (i >= bKeys.length) {
                    return false;
                }

                if (key !== bKeys[i]) {
                    return false;
                }

                if (!ejson.equals(a[key], b[bKeys[i]], options)) {
                    return false;
                }

                i++;
                return true;
            });
        } else {
            i = 0;
            ret = aKeys.every(function (key) {
                if (!hasOwn(b, key)) {
                    return false;
                }

                if (!ejson.equals(a[key], b[key], options)) {
                    return false;
                }

                i++;
                return true;
            });
        }

        return ret && i === bKeys.length;
    }

    clone(v) {
        const ejson = this;
        var ret;

        if (_typeof(v) !== 'object') {
            return v;
        }

        if (v === null) {
            return null; // null has typeof "object"
        }

        if (v instanceof Date) {
            return new Date(v.getTime());
        } // RegExps are not really EJSON elements (eg we don't define a serialization
        // for them), but they're immutable anyway, so we can support them in clone.


        if (v instanceof RegExp) {
            return v;
        }

        if (this.isBinary(v)) {
            ret = Base64.newBinary(v.length);

            for (var i = 0; i < v.length; i++) {
                ret[i] = v[i];
            }

            return ret;
        }

        if (Array.isArray(v)) {
            return v.map(function (value) {
                return ejson.clone(value);
            });
        }

        if (isArguments(v)) {
            return Array.from(v).map(function (value) {
                return ejson.clone(value);
            });
        } // handle general user-defined typed Objects if they have a clone method


        if (typeof v.clone === 'function') {
            return v.clone();
        } // handle other custom types


        if (ejson._isCustomType(v)) {
            return ejson.fromJSONValue(ejson.clone(ejson.toJSONValue(v)), true);
        } // handle other objects


        ret = {};
        Object.keys(v).forEach(function (key) {
            ret[key] = ejson.clone(v[key]);
        });
        return ret;
    }
}