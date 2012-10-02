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

function WebSQLAccess() {

    this.isAvailable = !!window.openDatabase;
    this.batchSize = 100;
    this.dbName = "benchmark";
    this.storeName = "benchmark";
    this.dbSize = 1024*1024*5;

    function commit(tx, callback) {
        tx.executeSql("COMMIT", function(){callback(true)}, function(){callback(false)});
    }

    this.open = function(callback) {
        var self = this;
        this.db = openDatabase(this.dbName, '1.0', 'javascript benchmark', this.dbSize);
        var error = function() { callback(false); }
        this.db.transaction(function(tx) {
            tx.executeSql("CREATE TABLE IF NOT EXISTS "+ self.storeName +" (key NCHAR(8), value)", [],
                function() {
                        tx.executeSql("CREATE INDEX IF NOT EXISTS "+ self.storeName +"_indx ON " + self.storeName + " (key)", [], function() {
                            callback(true);
                        }, error);
                }, error);
        });
    };

    this.close = function(callback) {
        this.clear(callback);
    }

    this.inject = function(key, value, callback) {
        var self = this;
        this.db.transaction(function(tx) {
            tx.executeSql("INSERT OR REPLACE INTO " + self.storeName+ " (key,value) VALUES (?,?)", [key, value],
                function() { callback(true);}, function() {callback(false)});
        });
    }

    function bulk(self, keys, values, offset, batchSize, callback) {
        if (offset >= keys.length) {
            callback(true);
        } else {
            self.db.transaction(function(tx) {
                var ok = true;
                var end = Math.min(keys.length, offset + batchSize);
                for (var i= offset; i<end; ++i) {
                    tx.executeSql("INSERT OR REPLACE INTO " + self.storeName+ " (key,value) VALUES (?,?)", [keys[i], values[i]],
                        function(){}, function(){ok=false;});
                }
                if (ok) {
                    setTimeout(function(){bulk(self, keys,values,end,batchSize,callback)},1);
                } else {
                    callback(false);
                }
            });
        }
    }

    this.injectBulk = function(keys, values, callback) {
        bulk(this, keys, values, 0, this.batchSize, callback);
    }

    this.clear = function(callback) {
        var self = this;
        this.db.transaction(function(tx) {
            tx.executeSql("DELETE FROM " + self.storeName,[], function(){callback(true);}, function(){callback(false);});
            //tx.executeSql("DELETE FROM " + self.storeName,[], function(){commit(tx,callback)}, function(){callback(false);});
        });
    }

    this.lookup = function(key, callback) {
        var self = this;
        this.db.transaction(function(tx) {
            tx.executeSql("SELECT * FROM " + self.storeName + " WHERE key=?", [key],
                function(tx,res) {
                    if (res.rows.length) {
                        var item = res.rows.item(0);
                        callback(item.value);
                    } else {
                        callback(undefined);
                    }
                    }, function() {
                    callback(false)
                });
        });
    };

}