/**
 * @module fw/Queue
 * @license MIT License
 * @author Ludovic Desweemer
 */

'use strict';

var types = require('./types');

/**
 * Create a queue
 * @class
 * @alias module:fw/Queue
 */
class Queue {
    /**
     * @constructor
     */
    constructor() {
        this.queue = [];
    }
    /**
     * Get an item from the queue
     * @method get
     * @param {number} index - index of the item to be retrieved
     * @return {*}
     */
    get(index) {
        var obj = this.queue[index];

        if (obj !== undefined) return obj.content;
    }
    /**
     * Add an item to the queue
     * @method add
     * @param {*} item - item to be added to the queue
     * @return {number} length of the queue
     */
    add(item) {
        var curObj = { previous: null, content: item,  next: null };
        var lastObj = null;
        var l = this.queue.length;

        if (l > 0) {
            lastObj = this.queue[l - 1];
            lastObj.next = curObj;
            curObj.previous = lastObj;
        }

        this.queue.push(curObj);

        return this.queue.length;
    }
    /**
     * Add an array of items to the queue
     * @method addArray
     * @param {Object} items - array of items to be added to the queue
     * @return {number} length of the queue
     */
    addArray(items) {
        var self = this;
        var lastObj = null;
        var l = this.queue.length;
        var n, curObj, item;

        if (l > 0) {
            lastObj = this.queue[l - 1];
        }

        if (items instanceof Array) {
            for (n = 0, l = items.length; n < l; n++) {
                item = items[n];

                curObj = {
                    previous: lastObj,
                    content: item,
                    next: null
                };

                if (lastObj !== null) {
                    lastObj.next = curObj;
                }

                self.queue.push(curObj);
                lastObj = curObj;
            }
        }

        return this.queue.length;
    }
    /**
     * Update an item in the queue
     * @method update
     * @param {number} index - index of the item to be updated
     * @param {*} item - new item
     * @return {*} item updated
     */
    update(index, item) {
        var obj = this.queue[index];

        if (this.queue.length > 0) {
            if (obj !== undefined) {
                obj.content = item;
                return item;
            }
        }
    }
    /**
     * Remove an item from the queue
     * @method remove
     * @param {number} index - index of the item to be removed
     * @return {*} item removed
     */
    remove(index) {
        var obj = this.queue[index];

        if (obj !== undefined) {
            if (obj.previous !== null) {
                obj.previous.next = obj.next;
            }

            if (obj.next !== null) {
                obj.next.previous = obj.previous;
            }

            this.queue.splice(index, 1);

            return obj.content;
        }
    }
    /**
     * Iterate all items in the queue
     * @method forEach
     * @param {function} cb - function(item) callback function that stop the iteration when returning false
     */
    forEach(cb) {
        if (!types.isFunction(cb)) return;

        var obj;

        if (this.queue.length > 0) {
            obj = this.queue[0];

            do {
                if (cb.call(this, obj.content) === false) break;
                obj = obj.next;
            } while (obj !== null);
        }
    }
    /**
     * Return the length of the queue
     * @method getSize
     * @return {number}
     */
    getSize() {
        return this.queue.length;
    }
    /**
     * Get the first item of the queue
     * @method first
     * @return {*}
     */
    first() {
        if (this.queue.length > 0) {
            return this.queue[0].content;
        }
    }
    /**
     * Get the last item of the queue
     * @method last
     * @return {*}
     */
    last() {
        var l = this.queue.length;

        if (l > 0) {
            return this.queue[l - 1].content;
        }
    }
    /**
     * Return all items in the queue
     * @method toArray
     * @return {Array}
     */
    toArray() {
        var n, l, array = [];

        for (n = 0, l = this.queue.length; n < l; n++) {
            array.push(this.queue[n].content);
        }

        return array;
    }
    /**
     * Serialize the array to JSON
     * @method toJSON
     * @return {Array}
     */
    toJSON() {
        return this.toArray();
    }
    /**
     * Get an array slice
     * @method getSlice
     * @param {number} start - first index of the selection
     * @param {number} end - last index of the selection
     * @return {Array}
     */
    getSlice(start, end) {
        var queueLength = this.queue.length;
        var array = [];
        var n, l;

        if (queueLength !== 0 && start <= end) {
            n = start < queueLength ? start : queueLength - 1;
            l = end < queueLength ? end : queueLength - 1;

            for (; n <= l; n++) {
                array.push(this.queue[n].content);
            }
        }

        return array;
    }
    /**
     * Remove all items from the array
     * @method clear
     */
    clear() {
        this.queue.length = 0;
    }
}

module.exports = Queue;
