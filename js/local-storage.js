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

function LocalStorageAccess() {

    this.isAvailable = !!window.localStorage;
    this.batchSize = 100;

    this.open = function(callback) {
        callback(true);
    };

    this.close = function(callback) {
        this.clear(callback);
    }

    this.inject = function(key, value, callback) {
        localStorage[key] = value;
        return callback(true);
    }

    function bulk(keys, values, offset, batchSize, callback) {
        if (offset >= keys.length) {
            callback();
        } else {
            for (var i= offset, max = Math.min(keys.length, offset + batchSize); i<max; ++i) {
                localStorage[keys[i]] = values[i];
            }
            setTimeout(function() { bulk(keys, values, offset+batchSize, batchSize, callback); }, 0);
        }
    }

    this.injectBulk = function(keys, values, callback) {
        bulk(keys, values, 0, this.batchSize, callback);
    }

    this.clear = function(callback) {
        localStorage.clear();
        callback();
//        function doclear(batchSize) {
//            var i = 0;
//            for (var k in localStorage) {
//                localStorage.removeItem(k);
//                if (++i > batchSize) {
//                    setTimeout(function() { doclear(batchSize) }, 0);
//                    return;
//                }
//            }
//            callback();
//        }
//
//        doclear(this.batchSize);
    }

    this.lookup = function(key, callback) {
        callback(localStorage[key]);
    }

}