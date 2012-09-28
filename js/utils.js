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

function mk_sync_func(callback, count) {
    var i = 0;
    return function() {
        ++i;
        if (i >= count) {
            return callback();
        }
    }
}

function mkRandomString(size) {
    var result = "";
    for (var i=0;i<size; ++i) {
        result += String.fromCharCode(65+parseInt(Math.random()*26));
    }
    return result;
}

function addChart(benchmark, groupName, data) {
    var tests = benchmark.getForGroup(groupName);
    var header = [];
    if (data.length == 0) {
        header.push("Group");
        for (var i=0; i<tests.length; ++i) {
            header.push(tests[i].name);
        }
        data.push(header);
    }

    var line = [];
    line.push( groupName);
    for (var i=0; i<tests.length; ++i) {
        line.push(tests[i].result.time>=1?tests[i].result.time:1);
    }
    data.push(line);

    return data;
}

function makeFinalChart(benchmark, $dom) {
    $dom.html();
    var groups = benchmark.getAvailableGroups();
    var cdata = [];
    for (var i=0; i<groups.length; ++i) {
        addChart(benchmark, groups[i], cdata);
    }
    var data = google.visualization.arrayToDataTable(cdata);
    var options = {
        title: "Benchmark",
        hAxis: {title: 'Tests', titleTextStyle: {color: 'red'}},
        vAxis: {title: "ms" }
    };
    var $domEl = $("<div></div>");
    $domEl.appendTo($dom);
    $dom.addClass("finalchart");
    var chart = new google.visualization.ColumnChart($domEl.get(0));
    chart.draw(data, options);
}
