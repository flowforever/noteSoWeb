/**
 * Created by trump on 16/6/18.
 */
import {EventEmitter as EventEmitterBase} from "events";

class Collection {
    constructor() {
        this.collection = [];
    }
    
    /** @returns {Collection} */
    push(fn) {
        this.collection.push(fn);
        return this;
    }
    
    removeAll() {
        this.collection.forEach(fn=>fn());
        this.collection = [];
    }
}

export default class EventEmitter extends EventEmitterBase {
    constructor(eventKeys) {
        super();
        /** @private */
        this._remove_event_listeners = [];
        
        /** @field */
        this.EventKeys = {...eventKeys};
        
        this.setMaxListeners(9999);
    }
    
    on(eventName, fn) {
        super.on(eventName, fn);
        
        var removeFn = ()=> {
            this.removeListener(eventName, fn);
            this._remove_event_listeners = this._remove_event_listeners.filter(o=>o !== removeFn);
        };
        
        removeFn.eventName = eventName;
        
        if (!this._remove_event_listeners) {
            this._remove_event_listeners = [];
        }
        
        this._remove_event_listeners.push(removeFn);
        
        return removeFn;
    }
    
    removeByName(name) {
        this._remove_event_listeners.forEach(fn=> {
            if (fn.eventName === name) fn();
        });
        this._remove_event_listeners = this._remove_event_listeners.filter(o=>o.eventName !== name);
    }
    
    removeAll() {
        this._remove_event_listeners.forEach(fn=>fn());
        this._remove_event_listeners = [];
    }
    
    /** @returns Collection */
    createCollection() {
        return new Collection();
    }
    
}