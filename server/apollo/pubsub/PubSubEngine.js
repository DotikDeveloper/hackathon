import {PubSubEngine} from 'graphql-subscriptions';
import EventEmitter from 'events';
import PubSubAsyncIterator from './PubSubAsyncIterator';
import Users from "../../../modules/account/Users";

export default class PubSub extends PubSubEngine {
    constructor (options = {}) {
        super ();
        this.ee = options.eventEmitter || new EventEmitter ();
        this.subscriptions = {};
        this.subIdCounter = 0;
    }

    /**
     * @returns {Promise<void>}
     **/
    publish (triggerName, payload) {
        this.ee.emit (triggerName, payload);
        return Promise.resolve();
    }

    /**
     * @param {string} triggerName
     * @param {Function} onMessage
     * @returns {Promise<number>}
     **/
    // eslint-disable-next-line no-unused-vars
    subscribe (triggerName, onMessage,options={}){
        this.ee.addListener (triggerName, onMessage);
        this.subIdCounter = this.subIdCounter + 1;
        this.subscriptions[this.subIdCounter] = [triggerName, onMessage];

        return Promise.resolve (this.subIdCounter);
    }
    /**
     * @param {number} subId
     **/
    unsubscribe (subId) {
        const [triggerName, onMessage] = this.subscriptions[subId];
        delete this.subscriptions[subId];
        this.ee.removeListener (triggerName, onMessage);
    }

    /**
     * @param {string | string[]} triggers
     * @returns {AsyncIterator}
     **/
    asyncIterator(triggers){
        return new PubSubAsyncIterator(this, triggers);
    }
}