import PubSubEngine from "./PubSubEngine";
import _ from 'underscore';
import EJSON from 'ejson';
export default class ObservePubSub extends PubSubEngine{
    constructor (options = {}) {
        super (options);
        this.observer = options.observer;
        function serialize(model){
            if(model.toObject){
                return model.toObject ({getters: true});
            }else{
                return EJSON.clone(model);
            }
        }
        this.observer.on('added',(id,model)=>{
            this.publish ('added', {
                event:'added',
                payload: {
                    _id:id,
                    model:serialize(model)
                }
            });
        });

        this.observer.on('changed',(id, changedFields, newModel, oldModel)=>{
            this.publish ('changed', {
                event:'changed',
                payload:{
                    _id:id,
                    changedFields:changedFields,
                    model:serialize(newModel),
                    oldModel:serialize(oldModel),
                }
            });
        });

        this.observer.on('removed',(id, model)=>{
            this.publish ('removed', {
                event:'removed',
                payload: {
                    _id:id,
                    model: serialize(model)
                }
            });
        });

        this.ee.once('stop',()=>{
            this.observer.stop();
        });
        this.stopped = false;
    }

    stop(){
        this.stopped = true;
        this.ee.emit('stop');
    }

    unsubscribe (subId) {
        super.unsubscribe(subId);
        if(_.isEmpty(this.subscriptions)){
            this.stop();
        }
    }




}