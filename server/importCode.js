const MongoClient = require('mongodb').MongoClient;
import VmCodes from "/modules/vmrunner/models/VmCodes";
import _ from 'underscore';
import {get as safeGet} from 'lodash';
import queue from 'async/queue';

const q = queue(async function(task, callback) {
    try {
        await task ();
    }catch (e) {
        console.error(e);
    }finally {
        callback();
    }
}, 1);

let serverNames = ['db1server1','db1server3','db1server4','db1server5','db1server6','db1server7','db1server8','db1server9','db1server10','db1server11','db1server12','db1server13','skyline','s14'];

_.mapAsync(serverNames,async (serverName)=>{
    let url = serverName=='localhost'?'mongodb://localhost:27017/calls2':`mongodb://meteor:malibunproduct439800@${serverName}.minta365.ru:27017/calls2`;
    const dbName = 'calls2';

    // Use connect method to connect to the server
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        const menuItemsCollection = db.collection('menuItems');
        // Find some documents
        menuItemsCollection.find({type:'answer'}).toArray(function(err, docs) {
            _.each(docs,(doc)=>{
                _.each(safeGet(doc.answer,'variables',[]),(varData)=>{
                    if(varData.varname&&varData.expression&&varData.expression.trim()) {
                        q.push(async ()=>{
                            let oldModel = await VmCodes.findOne({expression:varData.expression});
                            if(!oldModel){
                                let model = new VmCodes();
                                model.expression = varData.expression;
                                model.meta = {
                                    user_id:null,
                                    project_id:null,
                                    menu_id:doc.menuId,
                                    tag:'answer'
                                };
                                await model.save();
                            }
                        });
                    }
                });
            });
        });

        menuItemsCollection.find({type:'vars_set'}).toArray(function(err, docs) {
            _.each(docs,(doc)=>{
                _.each(safeGet(doc.vars_set,'variables',[]),(varData)=>{
                    if(varData.varname&&varData.expression&&varData.expression.trim()) {
                        q.push(async ()=>{
                            let oldModel = await VmCodes.findOne({expression:varData.expression});
                            if(!oldModel){
                                let model = new VmCodes();
                                model.expression = varData.expression;
                                model.meta = {
                                    user_id:null,
                                    project_id:null,
                                    menu_id:doc.menuId,
                                    tag:'vars_set'
                                };
                                await model.save();
                            }
                        });
                    }
                });
            });
        });

        menuItemsCollection.find({type:'write'}).toArray(function(err, docs) {
            _.each(docs,(doc)=>{
                let expressions = [ doc.write.index,doc.write.value];
                _.each(expressions,(expression)=>{
                    q.push(async ()=>{
                        let oldModel = await VmCodes.findOne({expression:expression});
                        if(!oldModel){
                            let model = new VmCodes();
                            model.expression = expression;
                            model.meta = {
                                user_id:null,
                                project_id:null,
                                menu_id:doc.menuId,
                                tag:'write'
                            };
                            await model.save();
                        }
                    });
                });
            });
        });

        menuItemsCollection.find({type:'var_set'}).toArray(function(err, docs) {
            _.each(docs,(doc)=>{
                let expression = doc.var_set.varname;
                q.push(async ()=>{
                    let oldModel = await VmCodes.findOne({expression:expression});
                    if(!oldModel){
                        let model = new VmCodes();
                        model.expression = expression;
                        model.meta = {
                            user_id:null,
                            project_id:null,
                            menu_id:doc.menuId,
                            tag:'var_set'
                        };
                        await model.save();
                    }
                });
            });
        });

        menuItemsCollection.find({type:'execCode'}).toArray(function(err, docs) {
            _.each(docs,(doc)=>{
                let expression = doc.expression;
                q.push(async ()=>{
                    let oldModel = await VmCodes.findOne({expression:expression});
                    if(!oldModel){
                        let model = new VmCodes();
                        model.expression = expression;
                        model.meta = {
                            user_id:null,
                            project_id:null,
                            menu_id:doc.menuId,
                            tag:'execCode'
                        };
                        await model.save();
                    }
                });
            });
        });

        menuItemsCollection.find({type:'simpleInputMethod'}).toArray(function(err, docs) {
            _.each(docs,(doc)=>{
                let expression = doc.simpleInputMethod.expression;
                q.push(async ()=>{
                    let oldModel = await VmCodes.findOne({expression:expression});
                    if(!oldModel){
                        let model = new VmCodes();
                        model.expression = expression;
                        model.meta = {
                            user_id:null,
                            project_id:null,
                            menu_id:doc.menuId,
                            tag:'simpleInputMethod'
                        };
                        await model.save();
                    }
                });
            });
        });

        menuItemsCollection.find({phrases:{$exists:true}}).toArray(function(err, docs) {
            _.each(docs,(doc)=>{
                let expressions = _.chain(doc.phrases)
                .filter((phrase)=>{
                    return phrase.source === 'EXPRESSION'
                })
                .pluck('text')
                .value();

                _.each(expressions,(expression)=>{
                    q.push(async ()=>{
                        let oldModel = await VmCodes.findOne({expression:expression});
                        if(!oldModel){
                            let model = new VmCodes();
                            model.expression = expression;
                            model.meta = {
                                user_id:null,
                                project_id:null,
                                menu_id:doc.menuId,
                                tag:doc.type
                            };
                            await model.save();
                        }
                    });
                });
            });
        });

        const projectCriteriasCollection = db.collection('projectCriterias');

        projectCriteriasCollection.find({phrases:{$exists:true}}).toArray(function(err, docs) {
            _.each(docs,(doc)=>{
                let expressions = _.chain(doc.phrases)
                .filter((phrase)=>{
                    return phrase.source === 'EXPRESSION'
                })
                .pluck('text')
                .value();

                _.each(expressions,(expression)=>{
                    q.push(async ()=>{
                        let oldModel = await VmCodes.findOne({expression:expression});
                        if(!oldModel){
                            let model = new VmCodes();
                            model.expression = expression;
                            model.meta = {
                                user_id:null,
                                project_id:null,
                                menu_id:doc.menuId,
                                tag:'projectCriteriasPhrases'
                            };
                            await model.save();
                        }
                    });
                });
            });
        });

        //client.close();
    });
});
