import {$$asyncIterator} from 'iterall';
import PubSubEngine from './PubSubEngine';

/**
 * A class for digesting PubSubEngine events via the new AsyncIterator interface.
 * This implementation is a generic version of the AsyncIterator, so any PubSubEngine may
 * be used.
 * @class
 *
 * @constructor
 *
 * @property pullQueue @type {Function[]}
 * A queue of resolve functions waiting for an incoming event which has not yet arrived.
 * This queue expands as next() calls are made without PubSubEngine events occurring in-between.
 *
 * @property pushQueue @type {T[]}
 * A queue of PubSubEngine events waiting for next() calls to be made, which returns the queued events
 * for handling. This queue expands as PubSubEngine events arrive without next() calls occurring in-between.
 *
 * @property eventsArray @type {string[]}
 * An array of PubSubEngine event names that this PubSubAsyncIterator should watch.
 *
 * @property allSubscribed @type {Promise<number[]>}
 * undefined until next() called for the first time, afterwards is a promise of an array of all
 * subscription ids, where each subscription id identified a subscription on the PubSubEngine.
 * The undefined initialization ensures that subscriptions are not made to the PubSubEngine
 * before next() has ever been called.
 *
 * @property running @type {boolean}
 * Whether or not the PubSubAsyncIterator is in running mode (responding to incoming PubSubEngine events and next() calls).
 * running begins as true and turns to false once the return method is called.
 *
 * @property pubsub @type {PubSubEngine}
 * The PubSubEngine whose events will be observed.
 */
export default class PubSubAsyncIterator{
    /**
     * @param {PubSubEngine} pubsub
     * @param {string | string[]} eventNames
     * */
    constructor (pubsub, eventNames) {
        this.pubsub = pubsub;
        this.pullQueue = [];
        this.pushQueue = [];
        this.running = true;
        this.allSubscribed = null;
        this.eventsArray = typeof eventNames === 'string' ? [eventNames] : eventNames;
    }

    /**@returns Promise<IteratorResult>*/
    async next () {
        if (!this.allSubscribed) {
            await (this.allSubscribed = this.subscribeAll ());
        }
        return this.pullValue ();
    }

    /**@returns Promise<IteratorResult>*/
    async return () {
        await this.emptyQueue ();
        return {value: undefined, done: true};
    }

    async throw (error) {
        await this.emptyQueue ();
        return Promise.reject (error);
    }

    [$$asyncIterator] () {
        return this;
    }

    async pushValue (event) {
        await this.allSubscribed;
        if (this.pullQueue.length !== 0) {
            this.pullQueue.shift () (this.running
                ? {value: event, done: false}
                : {value: undefined, done: true},
            );
        } else {
            this.pushQueue.push (event);
        }
    }

    /**@returns Promise<IteratorResult>*/
    pullValue () {
        return new Promise (
            resolve => {
                if (this.pushQueue.length !== 0) {
                    resolve (this.running
                        ? {value: this.pushQueue.shift (), done: false}
                        : {value: undefined, done: true},
                    );
                } else {
                    this.pullQueue.push (resolve);
                }
            },
        );
    }

    async emptyQueue () {
        if (this.running) {
            this.running = false;
            this.pullQueue.forEach (resolve => resolve ({value: undefined, done: true}));
            this.pullQueue.length = 0;
            this.pushQueue.length = 0;
            const subscriptionIds = await this.allSubscribed;
            if (subscriptionIds) {
                this.unsubscribeAll (subscriptionIds);
            }
        }
    }

    subscribeAll () {
        return Promise.all (this.eventsArray.map (
            eventName => this.pubsub.subscribe (eventName, this.pushValue.bind (this), {}),
        ));
    }

    /**@param {number[]} subscriptionIds*/
    unsubscribeAll (subscriptionIds) {
        for (const subscriptionId of subscriptionIds) {
            this.pubsub.unsubscribe (subscriptionId);
        }
    }

}