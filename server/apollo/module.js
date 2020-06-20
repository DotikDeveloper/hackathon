import {AuthenticationError} from "apollo-server-errors";
import _ from "underscore";
import mongoose from 'mongoose';
import {get} from 'lodash';
import {isset} from "../lib/utils";
import EJSON from 'ejson';
import sift from 'sift';
import {abilityCondition, ability as acl2Ability} from "../../modules/acl2";

function isMongooseDoc (yourObject) {
    return (yourObject instanceof mongoose.Model);
}

function authenticatedOnly (target, key, descriptor) {
    const original = descriptor.value;
    descriptor.value = async function (obj, args, context, info) {
        if (!context.user)//TODO
            throw new AuthenticationError ('Not allowed');
        return original.apply (this, [obj, args, context, info]);
    }
    return descriptor;
}

function ability (permissions, resource) {
    return function (target, key, descriptor) {
        const original = descriptor.value;
        descriptor.value = async function ability (obj, args, context, info) {
            if (!resource) {
                resource = this.model.modelName;
            }

            let allowed = true;
            if (_.isFunction (permissions)) {
                allowed = await permissions.apply (this, [obj, args, context, info]);
            } else {
                if (!context.user)//TODO
                    throw new AuthenticationError ('Not allowed');
                const ability = await context.user.ability ();
                if (!_.isArray (permissions))
                    permissions = [permissions];

                _.each (permissions, (permission) => {
                    if (allowed) {
                        allowed = ability.can (permission, resource);
                        if (!allowed)
                            allowed = ability.can ('all', resource);
                    }
                });
            }
            if (!allowed) {
                throw new AuthenticationError ('Not allowed');
            }
            return original.apply (this, [obj, args, context, info]);
        };
        return descriptor;
    }
}

function ability2 (permissions) {
    return function (target, key, descriptor) {
        const original = descriptor.value;
        descriptor.value = async function ability2 (obj, args, context, info) {
            let allowed = true;
            if (_.isFunction (permissions)) {
                allowed = await permissions.apply (this, [obj, args, context, info]);
            } else {
                if (!context.user)//TODO
                    throw new AuthenticationError ('Not allowed');
                const ability = await context.user.ability ();
                if (!_.isArray (permissions))
                    permissions = [permissions];
                let model = null;
                if (_.size (permissions) == 1 && permissions.indexOf ('create') > -1) {
                    model = _.clone (args.model);
                    model.modelName = this.model.modelName;
                } else {
                    model = await this.model.findOne ({_id: args._id});
                }
                _.each (permissions, (permission) => {
                    if (allowed) {
                        allowed = ability.can (permission, model);
                        if (!allowed)
                            allowed = ability.can ('all', model);
                    }
                });
            }
            if (!allowed) {
                throw new AuthenticationError ('Not allowed');
            }
            return original.apply (this, [obj, args, context, info]);
        };
        return descriptor;
    }
}

function ability3 (actions, mode) {
    return function (target, key, descriptor) {
        const original = descriptor.value;
        descriptor.value = async function ability3 (obj, args, context, info) {
            if (!context.user)//TODO
                throw new AuthenticationError ('Not allowed');
            if (!_.isArray (actions))
                actions = [actions];

            let allowed = false;
            switch (mode) {
                case 'pagination': {
                    args.pagination = args.pagination || {};
                    args.pagination.filters = args.pagination.filters || {};
                    let acl2Condition = await abilityCondition (this.model.collection.name, actions, {
                        user: context.user,
                        model: this.model
                    });
                    let conditions = [];
                    if (!_.isEmpty (acl2Condition)) {
                        conditions.push (acl2Condition);
                    }
                    let filters = get (args, 'pagination.filters', {});
                    if (!_.isEmpty (filters)) {
                        conditions.push (filters);
                    }
                    if (!_.isEmpty (conditions)) {
                        args.pagination.filters = _.size (conditions) > 1 ? {$and: conditions} : _.first (conditions);
                    }
                    return original.apply (this, [obj, args, context, info]);
                }

                case 'create': {
                    let model = args.model;
                    let modelProxy = new Proxy (model, {
                        get: (target, property) => {
                            if (['collection'].indexOf (property) > -1) {
                                return this.model.collection;
                            }
                            return model[property];
                        },
                    });
                    allowed = await acl2Ability (modelProxy, actions, {
                        user: context.user,
                        model: model
                    });
                    if (!allowed) {
                        throw new AuthenticationError ('Not allowed');
                    } else {
                        return original.apply (this, [obj, args, context, info]);
                    }
                }

                case 'view': {
                    let model = await original.apply (this, [obj, args, context, info]);
                    if (!model)
                        return model;
                    allowed = await acl2Ability (model, actions, {
                        user: context.user,
                        model
                    });
                    if (!allowed) {
                        throw new AuthenticationError ('Not allowed');
                    }
                    return model;
                }
                case 'edit': {
                    let condition = {_id: args._id};
                    let model = await this.model.findOne (condition);
                    if (!model)
                        return original.apply (this, [obj, args, context, info]);
                    allowed = await acl2Ability (model, actions, {
                        user: context.user,
                        model
                    });
                    if (allowed) {
                        _.each (args.model, (val, key) => {
                            model.set (key, val);
                        });
                        allowed = await acl2Ability (model, actions, {
                            user: context.user,
                            model
                        });
                    }
                    if (!allowed) {
                        throw new AuthenticationError ('Not allowed');
                    }
                    return original.apply (this, [obj, args, context, info]);
                }

                case null: {
                    allowed = await acl2Ability (new this.model ({}), actions, {
                        user: context.user,
                        model: new this.model ({})
                    });
                    if (!allowed) {
                        throw new AuthenticationError ('Not allowed');
                    }
                    return original.apply (this, [obj, args, context, info]);
                }


                default: {
                    let condition = {_id: args._id};
                    let model = await this.model.findOne (condition);
                    if (!model)
                        return original.apply (this, [obj, args, context, info]);
                    allowed = await acl2Ability (model, actions, {
                        user: context.user,
                        model
                    });
                    if (!allowed) {
                        throw new AuthenticationError ('Not allowed');
                    }
                    return original.apply (this, [obj, args, context, info]);
                }

            }
        };
        return descriptor;
    }
}

function methods (names) {
    return function (clazz) {
        clazz[clazz.name] = clazz[clazz.name] || {};
        clazz[clazz.name].methods = clazz[clazz.name].methods || [];
        Array.prototype.push.apply (clazz[clazz.name].methods, names);
    }
}

function mutations (names) {
    return function (clazz) {
        clazz[clazz.name] = clazz[clazz.name] || {};
        clazz[clazz.name].mutations = clazz[clazz.name].mutations || [];
        Array.prototype.push.apply (clazz[clazz.name].mutations, names);
    }
}

function subscriptions (names) {
    return function (clazz) {
        clazz[clazz.name] = clazz[clazz.name] || {};
        clazz[clazz.name].subscriptions = clazz[clazz.name].subscriptions || [];
        Array.prototype.push.apply (clazz[clazz.name].subscriptions, names);
    }
}


function method (target, key, descriptor) {
    if (!target.constructor[target.constructor.name]) {
        target.constructor[target.constructor.name] = {};
    }
    if (!target.constructor[target.constructor.name].methods) {
        target.constructor[target.constructor.name].methods = [];
    }
    target.constructor[target.constructor.name].methods.push (key);
    return descriptor;
}

function mutation (target, key, descriptor) {
    if (!target.constructor[target.constructor.name]) {
        target.constructor[target.constructor.name] = {};
    }
    if (!target.constructor[target.constructor.name].mutations) {
        target.constructor[target.constructor.name].mutations = [];
    }
    target.constructor[target.constructor.name].mutations.push (key);
    return descriptor;
}

function viewConvert (target, key, descriptor) {
    const original = descriptor.value;
    descriptor.value = async function (obj, args, context, info) {
        try {
            let result = await original.apply (this, [obj, args, context, info]);
            if (!result) {
                return {message: 'Not found', success: false};
            }
            return result;
        } catch (err) {
            return {message: err.message, success: false, errors: [err.message]};
        }
    };
    return descriptor;
}

function editResponseConvert (target, key, descriptor) {
    const original = descriptor.value;
    descriptor.value = async function (obj, args, context, info) {
        try {
            let result = await original.apply (this, [obj, args, context, info]);

            if (!result) {
                return {message: 'Not found', success: false};
            }
            if (isMongooseDoc (result)) {
                return {
                    success: true,
                    message: 'OK',
                    _id: result._id,
                    model: result//.toObject ({getters: true, user: context.user})
                };
            }
            return result;
        } catch (err) {
            if (err.name == 'ValidationError') {
                let errors = _.chain (err.errors)
                .values ()
                .pluck ('message')
                .value ();
                return {message: _.first (errors), success: false, errors: errors};
            }
            return {message: err.message, success: false, errors: [err.message]};
        }
    };
    return descriptor;
}

function createResponseConvert (target, key, descriptor) {
    const original = descriptor.value;
    descriptor.value = async function (obj, args, context, info) {
        try {
            let result = await original.apply (this, [obj, args, context, info]);
            if (!result) {
                return {message: 'Not found', success: false};
            }
            if (isMongooseDoc (result)) {
                return {
                    success: true,
                    message: 'OK',
                    _id: result._id,
                    model: result
                };
            }
            return result;
        } catch (err) {
            if (err.name == 'ValidationError') {
                let errors = _.chain (err.errors)
                .values ()
                .pluck ('message')
                .value ();
                return {message: _.first (errors), success: false, errors: errors};
            }
            return {message: err.message, success: false, errors: [err.message]};
        }
    };
    return descriptor;
}

function removeResponseConvert (target, key, descriptor) {
    const original = descriptor.value;
    descriptor.value = async function (obj, args, context, info) {
        try {
            let result = await Promise.resolve (original.apply (this, [obj, args, context, info]));
            if (!result) {
                return {message: 'Not found', success: false, errors: []};
            }
            console.log ({result});
            if (result && isset (result.ok)) {
                return {
                    message: `Удалено ${result.deletedCount} записей`,
                    success: true,
                    errors: []
                }
            }
            return result;
        } catch (err) {
            return {message: err.message, success: false, errors: [err.message]};
        }
    };
    return descriptor;
}

function pagination (target, key, descriptor) {
    const original = descriptor.value;
    descriptor.value = async function (obj, args, context, info) {
        args.$condition = get (args, 'pagination.filters', {});
        args.$sort = get (args, 'pagination.sort', {});
        let $page = get (args, 'pagination.page', 1);
        let $perPage = get (args, 'pagination.perPage', 100);
        args.$skip = ($page - 1) * $perPage;
        args.$limit = $perPage;
        args.query = function (Model) {
            return Model
            .sort (args.$sort)
            .skip (args.$skip)
            .limit (args.$limit)
            .lean ({virtuals: true});
        };

        let result = original.apply (this, [obj, args, context, info]);
        if (result instanceof mongoose.Query) {
            const rows = await result.model
            .find (args.$condition)
            .merge (result)
            .sort (args.$sort)
            .skip (args.$skip)
            .limit (args.$limit)
            //.lean({virtuals: true})
            .exec ()
            /*.then ((models) => {
                return _.map (models, (model) => {
                    return model.toObject ({
                        getters: true,
                        user: context.user
                    });
                })
            });*/

            let total = await result.model
            .find (args.$condition)
            .merge (result)
            .countDocuments ();
            return {
                rows: rows,
                total
            }
        } else if (result && result.then) {
            result = await result;
        }
        if (_.isArray (result)) {
            if (!_.isEmpty (args.$condition)) {
                let condition = EJSON.clone (args.$condition);
                let siftQuery = sift (condition);
                result = _.chain (result)
                .filter ((model) => {
                    return siftQuery (model);
                })
                .value ();
            }
            result = result.slice (args.$skip, args.$skip + args.$limit);
            return {
                rows: result,
                total: _.size (result)//TODO?
            }
        }
        return result;
    };
    return descriptor;
}

/**@name SubscriptionOptions
 * @property {boolean} deep
 * @property {number|Function} pollingThrottleMs
 * @property {number|Function} pollingIntervalMs
 * */

/**@param {SubscriptionOptions} options*/
function subscription (options) {
    return function (target, key, descriptor) {
        const original = descriptor.value;
        descriptor.value = async function subscription (obj, args, context, info) {
            args.$condition = get (args, 'pagination.filters', {});
            args.$sort = get (args, 'pagination.sort', {});
            let $page = get (args, 'pagination.page', 1);
            let $perPage = get (args, 'pagination.perPage', 100);
            args.$skip = ($page - 1) * $perPage;
            args.$limit = $perPage;
            let baseQuery = original.apply (this, [obj, args, context, info]);

            let finalQuery = baseQuery.model
            .find (args.$condition)
            .merge (baseQuery)
            .sort (args.$sort)
            .skip (args.$skip)
            .limit (args.$limit);
            return this.subscribe (finalQuery, options);
        };
        return descriptor;
    }
}

function asCurrentUser (target, key, descriptor) {
    const original = descriptor.value;
    descriptor.value = async function (obj, args, context, info) {
        let currentUser = get (context, 'user.currentUser', null);
        let nexCtx = context;
        if (currentUser) {
            nexCtx = _.extend ({}, context);
            nexCtx.user = currentUser;
        }
        return await original.apply (this, [obj, args, nexCtx, info]);
    };
    return descriptor;
}

function asCurrentUserResolver (methods, mutations, subscriptions) {
    return function (clazz) {
        if (methods === undefined) {
            methods = clazz[clazz.name].methods
        }
        if (mutations === undefined) {
            mutations = clazz[clazz.name].mutations
        }
        if (subscriptions === undefined) {
            subscriptions = clazz[clazz.name].subscriptions
        }
        try {
            const patchNames = [...methods || [], ...mutations || [], ...subscriptions || []];
            _.each (patchNames, (patchName) => {
                const original = clazz.prototype[patchName];
                clazz.prototype[patchName] = async function (obj, args, context, info) {
                    let currentUser = get (context, 'user.currentUser', null);
                    let nexCtx = context;
                    if (currentUser) {
                        nexCtx = _.extend ({}, context);
                        nexCtx.user = currentUser;
                    }
                    return await original.apply (this, [obj, args, nexCtx, info]);
                }
            });
        } catch (e) {
            console.error (e);
        }
    }

}

export {
    methods, mutations, subscriptions,
    ability, ability2, ability3,
    method, mutation,
    createResponseConvert, editResponseConvert, removeResponseConvert, pagination, subscription,
    viewConvert,
    authenticatedOnly,
    asCurrentUser, asCurrentUserResolver,

    isMongooseDoc
}