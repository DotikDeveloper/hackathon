import queue from 'async/queue';
import {CustomServiceStates} from "../enums";
import CustomServiceInstances from "../models/CustomServiceInstances";
import {defaultLogger, LogLevels, Tags} from "../../logger";

/**
 * @category services
 * @subcategory classes
 *
 * @property {string} state Состояние сервиса
 * @property {CustomServiceInstances} instanceModel
 * */
export default class AbstractService {
    constructor (app, instanceModel) {
        this.instanceModel = instanceModel;
        this.app = app;
        this.updateQueue = queue (async (task, cb) => {
            if(this.instanceModel.isModified('meta')){
                if (!this.instanceModel.$__.saving) {
                    await this.instanceModel.save ();
                }else {
                    process.nextTick (() => {
                        if (this.updateQueue.length () <= 1) {
                            this.updateQueue.push ({});
                        }
                    });
                }
            }
            cb ();
        }, 1);
        this.meta = instanceModel.meta;
        this.instanceModel.state = CustomServiceStates.UNKNOWN.key;
    }

    get meta () {
        return this.$__meta;
    }

    set meta (meta) {
        const self = this;
        this.instanceModel.meta = meta;
        this.$__meta = new Proxy (this.instanceModel.meta, {
            set: function (target, key, value) {
                target[key] = value;
                self.instanceModel.markModified ('meta');
                process.nextTick (() => {
                    if (self.updateQueue.length () <= 1) {
                        self.updateQueue.push ({});
                    }
                });
                return true;
            },
            deleteProperty(target,name){
                delete target[name];
                self.instanceModel.markModified ('meta');
                process.nextTick (() => {
                    if (self.updateQueue.length () <= 1) {
                        self.updateQueue.push ({});
                    }
                });
                return true;
            }
        });
    }

    /**@returns {string}*/
    get state () {
        return this.instanceModel.state;
    }

    async start () {
        this.instanceModel.state = CustomServiceStates.RUNNING.key;
        await CustomServiceInstances.updateOne({ _id: this.instanceModel._id }, { state:this.instanceModel.state });
    }

    async stop () {
        this.instanceModel.state = CustomServiceStates.STOPPED.key;
        await CustomServiceInstances.updateOne({ _id: this.instanceModel._id }, { state:this.instanceModel.state });
    }

    async restart () {
        await this.stop ();
        return await this.start ();
    }

    async onError(err){
        if(this.instanceModel) {
            if(!this.instanceModel.populated('customService')){
                await this.instanceModel.populate('customService').execPopulate();
            }
            this.instanceModel.state = CustomServiceStates.ERROR.key;
            await CustomServiceInstances.updateOne({_id: this.instanceModel._id}, {state: this.instanceModel.state});
        }
        defaultLogger
        .builder ()
        .withLevel (LogLevels.error.key)
        .withError (err)
        .withData ({
            custom_service_id: this.instanceModel?.custom_service_id||null,
            custom_service_name: this.instanceModel?.customService?.name||'Unknown',
        })
        .withTag (Tags.system.key)
        .log ();
    }

}