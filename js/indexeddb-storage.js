/*
 * Copyright 2012 Rodrigo Reyes
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function IndexedDBAccess() {

    this.batchSize = 100;
    this.dbName = "benchmark";
    this.storeName = "benchmark";
    this.dbVersion = "1.0";

    try {
        this.indexedDB =  window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
        this.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.mozIDBTransaction || window.msIDBTransaction || {};
        this.READWRITEMODE  = this.IDBTransaction.readwrite || this.IDBTransaction.READ_WRITE || "readwrite";
        this.isAvailable = this.indexedDB && this.IDBTransaction && this.READWRITEMODE;

    } catch(e) {
        this.isAvailable = false;
    }

    this.open = function(callback) {
        var self = this;
        var openRequest = this.indexedDB.open(this.dbName, this.dbVersion);

        openRequest.onerror = function() {
            callback(false);
        };
        openRequest.onsuccess = function(ev) {
            self.database = ev.result || ev.target.result;

            if (self.database.version !== undefined && self.database.setVersion && self.database.version != self.dbVersion) {
                var versionreq = self.database.setVersion(self.dbVersion);
                versionreq.onerror = function() { callback(false); };
                versionreq.onsuccess = function(ev) {
                    if (!self.database.objectStoreNames.contains(self.storeName)) {
                        self.database.createObjectStore(self.storeName, {keyPath: "key"});
                    }
                    callback(true);
                }
            } else {
                callback(true);
            }
        };
        openRequest.onupgradeneeded = function(ev) {
            var database = ev.target.result;
            var domList = database.objectStoreNames;
            if (domList.contains(self.storeName) === false) {
                database.createObjectStore(self.storeName, {keyPath: "key"});
            }
        };
    };

    this.close = function(callback) {
        this.clear(callback);
    }

    this.inject = function(key, value, callback) {
        var tx = this.database.transaction([this.storeName], this.READWRITEMODE);
        var store = tx.objectStore(this.storeName);
        try {
            var req = store.put({key: key, value: value});
        } catch (e) {
            console && console.log && console.log(e);
        }
        req.onsuccess = function(){};
        req.onerror = function(){};
        tx.oncomplete = function() { callback(true);};
        tx.onerror = function() { callback(false);};
    }

    function bulk(self, keys, values, offset, batchSize, callback) {
        if (offset >= keys.length) {
            callback(true);
        } else {
            var tx = self.database.transaction([self.storeName], self.READWRITEMODE);
            var store = tx.objectStore(self.storeName);

            for (var i= offset, max = Math.min(keys.length, offset + batchSize); i<max; ++i) {
                var req = store.put({key: keys[i], value: values[i]});
            }
            var stop = false;
            req.onsuccess = function(){};
            req.onerror = function(){stop=true;};
            tx.oncomplete = function() {
                if (!stop) {
                    setTimeout(function() { bulk(self, keys, values, offset+batchSize, batchSize, callback); }, 1);
                }
            };
            tx.onerror = function() { callback(false);};
        }
    }

    this.injectBulk = function(keys, values, callback) {
        bulk(this, keys, values, 0, this.batchSize, callback);
    }

    this.clear = function(callback) {
        var tx = this.database.transaction([this.storeName], this.READWRITEMODE);
        var store = tx.objectStore(this.storeName);
        var req = store.clear();
        var result = true;
        req.onsuccess = function(){  };
        req.onerror = function(){ result=false; };
        tx.oncomplete = function() { callback(result);};
        tx.onerror = function() { callback(false);};
    }

    this.lookup = function(key, callback) {
        // callback(localStorage[key]);

        var tx = this.database.transaction([this.storeName]);
        var store = tx.objectStore(this.storeName);
        var req = store.get(key);
        req.onsuccess = function(ev) {
            if (ev.target.result === undefined) {
                callback(false);
            } else {
                callback(req.result.value);
            }
        }
        req.onerror = function() {
            callback(false);
        };
    }

}
