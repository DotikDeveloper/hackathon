import _ from 'underscore';
import DateQuery from "./DateQuery";

export default
class MongoBuilder{
    constructor(){
        this.operators = {
            equal:            { type: 'equal',            nb_inputs: 1, multiple: false, apply_to: ['string', 'number', 'datetime', 'boolean'] },
            not_equal:        { type: 'not_equal',        nb_inputs: 1, multiple: false, apply_to: ['string', 'number', 'datetime', 'boolean'] },
            in:               { type: 'in',               nb_inputs: 1, multiple: true,  apply_to: ['string', 'number', 'datetime'] },
            not_in:           { type: 'not_in',           nb_inputs: 1, multiple: true,  apply_to: ['string', 'number', 'datetime'] },
            less:             { type: 'less',             nb_inputs: 1, multiple: false, apply_to: ['number', 'datetime'] },
            less_or_equal:    { type: 'less_or_equal',    nb_inputs: 1, multiple: false, apply_to: ['number', 'datetime'] },
            greater:          { type: 'greater',          nb_inputs: 1, multiple: false, apply_to: ['number', 'datetime'] },
            greater_or_equal: { type: 'greater_or_equal', nb_inputs: 1, multiple: false, apply_to: ['number', 'datetime'] },
            between:          { type: 'between',          nb_inputs: 2, multiple: false, apply_to: ['number', 'datetime'] },
            not_between:      { type: 'not_between',      nb_inputs: 2, multiple: false, apply_to: ['number', 'datetime'] },
            begins_with:      { type: 'begins_with',      nb_inputs: 1, multiple: false, apply_to: ['string'] },
            not_begins_with:  { type: 'not_begins_with',  nb_inputs: 1, multiple: false, apply_to: ['string'] },
            contains:         { type: 'contains',         nb_inputs: 1, multiple: false, apply_to: ['string'] },
            not_contains:     { type: 'not_contains',     nb_inputs: 1, multiple: false, apply_to: ['string'] },
            ends_with:        { type: 'ends_with',        nb_inputs: 1, multiple: false, apply_to: ['string'] },
            not_ends_with:    { type: 'not_ends_with',    nb_inputs: 1, multiple: false, apply_to: ['string'] },
            is_empty:         { type: 'is_empty',         nb_inputs: 0, multiple: false, apply_to: ['string'] },
            is_not_empty:     { type: 'is_not_empty',     nb_inputs: 0, multiple: false, apply_to: ['string'] },
            is_null:          { type: 'is_null',          nb_inputs: 0, multiple: false, apply_to: ['string', 'number', 'datetime', 'boolean'] },
            is_not_null:      { type: 'is_not_null',      nb_inputs: 0, multiple: false, apply_to: ['string', 'number', 'datetime', 'boolean'] }
        };
        this.settings = {
            default_condition:'AND',
            mongoOperators: {
                equal: function(a,mode) {
                    if(mode==DateQuery.Mode.date.key||mode==DateQuery.Mode.datetime.key){
                        return {
                            $gte: a[0],
                            $lte: a[1]
                        }
                    }else
                        return a[0]
                },
                not_equal: function(a,mode) {
                    if(mode==DateQuery.Mode.date.key||mode==DateQuery.Mode.datetime.key){
                        return {
                            $not:{
                                $gte: a[0],
                                $lte: a[1]
                            }
                        }
                    }else return {
                        $ne: a[0]
                    }
                },
                "in": function(a) {
                    return {
                        $in: _.flatten(a)
                    }
                },
                not_in: function(a) {
                    return {
                        $nin: _.flatten(a)
                    }
                },
                less: function(a) {
                    return {
                        $lt: a[0]
                    }
                },
                less_or_equal: function(a) {
                    return {
                        $lte: a[0]
                    }
                },
                greater: function(a,mode) {
                    if(mode==DateQuery.Mode.date.key||mode==DateQuery.Mode.datetime.key){
                        return {
                            $gt: a[1]
                        }
                    }else return {
                        $gt: a[0]
                    }
                },
                greater_or_equal: function(a) {
                    return {
                        $gte: a[0]
                    }
                },
                between: function(a) {
                    return {
                        $gte: a[0],
                        $lte: a[1]
                    }
                },
                not_between: function(a) {
                    return {
                        $not:{
                            $gte: a[0],
                            $lte: a[1]
                        }
                    }
                },
                begins_with: function(a) {
                    return {
                        $regex: "^" + escapeRegExp(a[0])
                    }
                },
                not_begins_with: function(a) {
                    return {
                        $regex: "^(?!" + escapeRegExp(a[0]) + ")"
                    }
                },
                contains: function(a) {
                    return {
                        $regex: escapeRegExp(a[0])
                    }
                },
                not_contains: function(a) {
                    return {
                        $regex: "^((?!" + escapeRegExp(a[0]) + ").)*$",
                        $options: "s"
                    }
                },
                ends_with: function(a) {
                    return {
                        $regex: escapeRegExp(a[0]) + "$"
                    }
                },
                not_ends_with: function(a) {
                    return {
                        $not:"/(" + escapeRegExp(a[0]) + ")$/"
                    }
                },
                is_empty: function(a) {
                    return ""
                },
                is_not_empty: function(a) {
                    return {
                        $ne: ""
                    }
                },
                is_null: function(a) {
                    return null
                },
                is_not_null: function(a) {
                    return {
                        $ne: null
                    }
                }
            },
            mongoRuleOperators: {
                $ne: function(v) {
                    v = v.$ne;
                    return {
                        'val': v,
                        'op': v === null ? 'is_not_null' : (v === '' ? 'is_not_empty' : 'not_equal')
                    };
                },
                eq: function(v) {
                    return {
                        'val': v,
                        'op': v === null ? 'is_null' : (v === '' ? 'is_empty' : 'equal')
                    };
                },
                $regex: function(v) {
                    v = v.$regex;
                    if (v.slice(0, 4) == '^(?!' && v.slice(-1) == ')') {
                        return { 'val': v.slice(4, -1), 'op': 'not_begins_with' };
                    }
                    else if (v.slice(0, 5) == '^((?!' && v.slice(-5) == ').)*$') {
                        return { 'val': v.slice(5, -5), 'op': 'not_contains' };
                    }
                    else if (v.slice(0, 4) == '(?<!' && v.slice(-2) == ')$') {
                        return { 'val': v.slice(4, -2), 'op': 'not_ends_with' };
                    }
                    else if (v.slice(-1) == '$') {
                        return { 'val': v.slice(0, -1), 'op': 'ends_with' };
                    }
                    else if (v.slice(0, 1) == '^') {
                        return { 'val': v.slice(1), 'op': 'begins_with' };
                    }
                    else {
                        return { 'val': v, 'op': 'contains' };
                    }
                },
                between: function(v) {
                    return { 'val': [v.$gte, v.$lte], 'op': 'between' };
                },
                not_between: function(v) {
                    return { 'val': [v.$lt, v.$gt], 'op': 'not_between' };
                },
                $in: function(v) {
                    return { 'val': v.$in, 'op': 'in' };
                },
                $nin: function(v) {
                    return { 'val': v.$nin, 'op': 'not_in' };
                },
                $lt: function(v) {
                    return { 'val': v.$lt, 'op': 'less' };
                },
                $lte: function(v) {
                    return { 'val': v.$lte, 'op': 'less_or_equal' };
                },
                $gt: function(v) {
                    return { 'val': v.$gt, 'op': 'greater' };
                },
                $gte: function(v) {
                    return { 'val': v.$gte, 'op': 'greater_or_equal' };
                }
            },
        };
    }

    getOperatorByType (type) {
        if (type == '-1') {
            return null;
        }
        var result = null;
        _.each(this.operators,function(operator){
            if(operator.type==type)
                result = operator;
        });
        return result;
    }

    change(type,value){
        return value;
    }

    async getMongo(data,now=new Date(),options={}) {
        data = (data === undefined) ? {} : data;
        const self = this;
        return (async function parse(group) {
            if (!group.condition) {
                group.condition = self.settings.default_condition;
            }
            if (['AND', 'OR'].indexOf(group.condition.toUpperCase()) === -1) {
                throw new Error('UndefinedMongoCondition', `Unable to build MongoDB query with condition "${group.condition}"`);
            }
            if (!group.rules) {
                return {};
            }
            let parts = [];

            await Promise.all(
                _.map(group.rules ,async function(rule) {
                    if (!_.isEmpty(rule.rules)) {
                        parts.push(await parse(rule));
                    }else {
                        let mdb = self.settings.mongoOperators[rule.operator];
                        let ope = self.getOperatorByType(rule.operator);
                        let values = [];
                        if (mdb === undefined) {
                            throw new Error('UndefinedMongoOperator',`Unknown MongoDB operation for operator "${rule.operator}"`);
                        }
                        if (ope.nb_inputs !== 0) {
                            if (!(rule.value instanceof Array)) {
                                rule.value = [rule.value];
                            }
                            await Promise.all(
                                _.map(rule.value,async function(_v){
                                    if(options.convert){
                                        let v =  await options.convert(_v);
                                        values.push(v);
                                    }else{
                                        values.push(changeType.apply(rule,[_v, rule.type, false]));
                                    }
                                })
                            );
                        }
                        let ruleExpression = {};
                        let field = self.change('getMongoDBField', rule.field, rule);
                        self.field = field;
                        let mode = null;

                        let match = /DATE\((.*)+\)/i.exec(field);
                        if(match){
                            mode = DateQuery.Mode.date.key;
                            field = match[1];
                        }else{
                            match = /DATETIME\((.*)+\)/i.exec(field);
                            if(match){
                                mode = DateQuery.Mode.datetime.key;
                                field = match[1];
                            }
                        }
                        if(!mode) {
                            ruleExpression[field] = mdb.call(self, values);
                        }else{
                            let parsed = DateQuery.parse(values[0],mode,now);
                            values = [parsed.from,parsed.to];
                            ruleExpression[field] = mdb.call(self, values,mode);
                        }
                        parts.push(self.change('ruleToMongo', ruleExpression, rule, values, mdb));

                    }
                })
            );

            let groupExpression = {};
            groupExpression['$' + group.condition.toLowerCase()] = parts;

            /**
             * Modifies the MongoDB expression generated for a group
             * @ignore
             * @event changer:groupToMongo
             * @memberof module:MongoDbSupportPlugin
             * @param {object} expression
             * @param {Group} group
             * @returns {object}
             */
            return self.change('groupToMongo', groupExpression, group);
        }(data));
    }

    getRulesFromMongo(query) {
        if (query === undefined || query === null) {
            return null;
        }

        var self = this;

        /**
         * Custom parsing of a MongoDB expression, you can return a sub-part of the expression, or a well formed group or rule JSON
         * @ignore
         * @event changer:parseMongoNode
         * @memberof module:MongoDbSupportPlugin
         * @param {object} expression
         * @returns {object} expression, rule or group
         */
        query = self.change('parseMongoNode', query);

        // a plugin returned a group
        if ('rules' in query && 'condition' in query) {
            return query;
        }

        // a plugin returned a rule
        if ('id' in query && 'operator' in query && 'value' in query) {
            return {
                condition: this.settings.default_condition,
                rules: [query]
            };
        }

        var key = andOr(query);
        if (!key) {
            throw new Error('MongoParse', 'Invalid MongoDB query format');
        }

        return (function parse(data, topKey) {
            var rules = data[topKey];
            var parts = [];

            rules.forEach(function(data) {
                // allow plugins to manually parse or handle special cases
                data = self.change('parseMongoNode', data);

                // a plugin returned a group
                if ('rules' in data && 'condition' in data) {
                    parts.push(data);
                    return;
                }

                // a plugin returned a rule
                if ('id' in data && 'operator' in data && 'value' in data) {
                    parts.push(data);
                    return;
                }

                var key = andOr(data);
                if (key) {
                    parts.push(parse(data, key));
                }
                else {
                    var field = Object.keys(data)[0];
                    var value = data[field];

                    var operator = determineMongoOperator(value, field);
                    if (operator === undefined) {
                        throw new Error('MongoParse', 'Invalid MongoDB query format');
                    }

                    var mdbrl = self.settings.mongoRuleOperators[operator];
                    if (mdbrl === undefined) {
                        throw new Error('UndefinedMongoOperator', `JSON Rule operation unknown for operator "${operator}"`);
                    }

                    var opVal = mdbrl.call(self, value);

                    /**
                     *
                     * Returns a filter identifier from the MongoDB field
                     * @ignore
                     * @event changer:getMongoDBFieldID
                     * @memberof module:MongoDbSupportPlugin
                     * @param {string} field
                     * @param {*} value
                     * @returns {string}
                     */
                    var id = self.change('getMongoDBFieldID', field, value);

                    /**
                     * Modifies the rule generated from the MongoDB expression
                     * @ignore
                     * @event changer:mongoToRule
                     * @memberof module:MongoDbSupportPlugin
                     * @param {object} rule
                     * @param {object} expression
                     * @returns {object}
                     */
                    var rule = self.change('mongoToRule', {
                        id: id,
                        field: field,
                        operator: opVal.op,
                        value: opVal.val
                    }, data);

                    parts.push(rule);
                }
            });

            /**
             * Modifies the group generated from the MongoDB expression
             * @ignore
             * @event changer:mongoToGroup
             * @memberof module:MongoDbSupportPlugin
             * @param {object} group
             * @param {object} expression
             * @returns {object}
             */
            return self.change('mongoToGroup', {
                condition: topKey.replace('$', '').toUpperCase(),
                rules: parts
            }, data);
        }(query, key));
    }

    setRulesFromMongo(query) {
        this.setRules(this.getRulesFromMongo(query));
    }
}

/**
 * Finds which operator is used in a MongoDB sub-object
 * @memberof module:MongoDbSupportPlugin
 * @param {*} value
 * @returns {string|undefined}
 * @private
 */
function determineMongoOperator(value) {
    if (value !== null && typeof value == 'object') {
        var subkeys = Object.keys(value);

        if (subkeys.length === 1) {
            return subkeys[0];
        }
        else {
            if (value.$gte !== undefined && value.$lte !== undefined) {
                return 'between';
            }
            if (value.$lt !== undefined && value.$gt !== undefined) {
                return 'not_between';
            }
            else if (value.$regex !== undefined) { // optional $options
                return '$regex';
            }
            else {
                return;
            }
        }
    }
    else {
        return 'eq';
    }
}

/**
 * Returns the key corresponding to "$or" or "$and"
 * @memberof module:MongoDbSupportPlugin
 * @param {object} data
 * @returns {string}
 * @private
 */
function andOr(data) {
    var keys = Object.keys(data);
    for (var i = 0, l = keys.length; i < l; i++) {
        if (keys[i].toLowerCase() == '$or' || keys[i].toLowerCase() == '$and') {
            return keys[i];
        }
    }
    return undefined;
}


function changeType(value, type, boolAsInt) {
    switch (type) {
        // @formatter:off
        case 'integer':
            return parseInt(value);
        case 'double': return parseFloat(value);
        case 'boolean':
            var bool = value.trim().toLowerCase() === 'true' || value.trim() === '1' || value === 1;
            return boolAsInt ? (bool ? 1 : 0) : bool;
        default:
            if(value&&value.toString){
                return value.toString();
            }
            return value;
        // @formatter:on
    }
}

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}