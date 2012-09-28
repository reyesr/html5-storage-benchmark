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

/**
 * Injects key/value data into the store, and looks up each element one by one.
 * @param store the storage object to use
 * @param count the number of elements to injects and read
 * @param keySize the size of the keys, in bytes
 * @param valueSize the size of the values injected/read, in bytes
 * @return {Function} a function receiving a TestManager, and that can execute the test
 */
function mkTestLookup(store, count, keySize, valueSize) {
    return function(testManager) {
        var index = store;
        if (index) {
            index.clear(function(b) {
                var keys = [];
                var values = [];
                for (var i=0; i<count; ++i) {
                    keys.push(mkRandomString(keySize));
                    values.push(mkRandomString(valueSize));
                }
                index.injectBulk(keys, values, function() {
                    setTimeout(function() {
                        function readAndConsume(keyArr, valueArr, offset) {
                            if (offset >= keyArr.length) {
                                testManager.stopTimer();
                                testManager.testComplete(true);
                            } else {
                                index.lookup(keyArr[offset], function(val) {
                                    if (val === false || val !== valueArr[offset]) {
                                        testManager.stopTimer();
                                        testManager.testComplete(false);
                                    } else {
                                        readAndConsume(keyArr, valueArr, offset+1);
                                    }
                                });
                            }
                        }
                        testManager.startTimer();
                        readAndConsume(keys, values, 0);
                    },0);
                });
            });
        } else {
            testManager.testComplete(false);
        }
    }
}

function mkTestInject(store, count, keySize, valueSize) {
    return function(testManager) {
        var index = store;
        if (index) {
            index.clear(function(b) {
                var keys = [];
                var values = [];
                for (var i=0; i<count; ++i) {
                    keys.push(mkRandomString(keySize));
                    values.push(mkRandomString(valueSize));
                }

                var synchronizer = mk_sync_func(function(res) {
                    testManager.stopTimer();
                    testManager.testComplete(true);
                }, count);

                function injector(keys, values, offset, callback) {
                    if (offset >= keys.length) {
                        return callback(true);
                    }

                    index.inject(keys[offset], values[offset], function() {
                        setTimeout(function() {
                            injector(keys, values, offset+1, callback);
                        },0);
                    });
                }

                testManager.startTimer();
                injector(keys,values,0, function() {
                    testManager.stopTimer();
                    testManager.testComplete(true);
                });
            });
        } else {
            testManager.testComplete(false);
        }
    }
}

function mkTestInjectBulk(store, count, keySize, valueSize) {
    return function(testManager) {
        var index = store;
        if (index) {
            index.clear(function(b) {
                var keys = [];
                var values = [];
                for (var i=0; i<count; ++i) {
                    keys.push(mkRandomString(keySize));
                    values.push(mkRandomString(valueSize));
                }

                testManager.startTimer();
                index.injectBulk(keys, values, function() {
                    testManager.stopTimer();
                    testManager.testComplete(true);
                });
            });
        } else {
            testManager.testComplete(false);
        }
    }
}

function mkTestClear(store, count, keySize, valueSize) {
    return function(testManager) {
        var index = store;
        if (index) {
            index.clear(function(b) {
                var keys = [];
                var values = [];
                for (var i=0; i<count; ++i) {
                    keys.push(mkRandomString(keySize));
                    values.push(mkRandomString(valueSize));
                }

                index.injectBulk(keys, values, function() {
                    testManager.startTimer();
                    index.clear(function() {
                        testManager.stopTimer();
                        testManager.testComplete(true);
                    });
                });
            });
        } else {
            testManager.testComplete(false);
        }
    }
}
