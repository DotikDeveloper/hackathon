import async from 'async';
import './underscore.mixins';
import _ from 'underscore';

_.mixin({
    seqNew(fns,transform){
        let wrappedFs = _.chain(fns)
        .map((_f)=>{
            return function (handler, callback) {

                let callbackWrapper =_.once( (err, fResult)=> {
                    if(_f.name)
                        handler[_f.name] = fResult;
                    try {
                        callback(err, handler);
                    }catch(e){
                        console.log('handler:',handler);
                        console.log('_f:',_f);
                        console.log(e.trace);
                        console.log(e);
                        callback(e, handler);
                    }
                });
                let promise = _f.apply(null, [handler, callbackWrapper]);
                if(promise!==undefined) {
                    (async function() {
                        if (promise && promise.then) {
                            try {
                                callbackWrapper (null, await promise);
                            } catch (e) {
                                callbackWrapper (e);
                            }
                        } else {
                            callbackWrapper (null, promise)
                        }
                    }).apply();
                }
            };
        })
        .value();

        const seq = async.seq.apply(null, wrappedFs);
        return new Promise((resolve,reject)=>{
            seq({}, function (err, handler) {
                if(transform){
                    try {
                        let transformed = transform (err, handler);
                        resolve(transformed);
                    }catch (e) {
                        reject(err);
                    }
                }else{
                    if (err)
                        reject(err);
                    else
                        resolve(handler);
                }
            });
        });
    },

    eachLimit(coll,limit,iteratee){
        let wrappedIteratee = function(item,callback){
            let callbackWrapper =_.once( (err, fResult)=> {
                try {
                    callback(err, fResult);
                }catch(e){
                    console.log('item:',item);
                    console.log('result:',fResult);
                    console.log(e.trace);
                    console.log(e);
                    callback(e, fResult);
                }
            });
            let promise = iteratee.apply(null, [item, callbackWrapper]);
            if(promise!==undefined) {
                (async function() {
                    if (promise && promise.then) {
                        try {
                            callbackWrapper (null, await promise);
                        } catch (e) {
                            callbackWrapper (e);
                        }
                    } else {
                        callbackWrapper (null, promise)
                    }
                }).apply();
            }
        };

        return  async.forEachLimit.apply(null, [coll,limit,wrappedIteratee]);
    },

    sum(array){
        return _.reduce(array, function(memo, num){ return memo + num; }, 0);
    }
});