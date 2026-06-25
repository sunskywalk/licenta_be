/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 94.625, "KoPercent": 5.375};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.2674375, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.2265, 500, 1500, "GET Classes"], "isController": false}, {"data": [0.0095, 500, 1500, "GET Grades student stats"], "isController": false}, {"data": [0.2415, 500, 1500, "POST Login"], "isController": false}, {"data": [0.2005, 500, 1500, "GET Notifications"], "isController": false}, {"data": [0.2905, 500, 1500, "GET Stats classes"], "isController": false}, {"data": [0.6855, 500, 1500, "GET Schedule current week"], "isController": false}, {"data": [0.0025, 500, 1500, "GET Grades (all)"], "isController": false}, {"data": [0.483, 500, 1500, "GET Ping"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 8000, 430, 5.375, 13554.395125000035, 0, 151119, 2460.5, 50509.3, 63773.8, 90671.94, 12.18434920344817, 23515.496210596004, 4.141683693818727], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["GET Classes", 1000, 65, 6.5, 7813.640000000008, 1, 85228, 2325.5, 24192.199999999975, 47363.449999999924, 67212.59, 1.526580048514714, 73.63930404312818, 0.49175556133111675], "isController": false}, {"data": ["GET Grades student stats", 1000, 113, 11.3, 28425.59000000001, 1, 102854, 19295.5, 60522.7, 67303.8, 82999.58, 1.5250109419535085, 1.3608593002982923, 0.5178603562730563], "isController": false}, {"data": ["POST Login", 1000, 28, 2.8, 12409.834, 64, 94443, 2045.0, 54330.49999999999, 65463.899999999994, 71380.79000000001, 1.526039576310372, 1.0363671564427102, 0.61259162913881], "isController": false}, {"data": ["GET Notifications", 1000, 35, 3.5, 4736.641000000003, 1, 96094, 2307.0, 8774.8, 15558.0, 60976.41000000001, 1.5258905478710012, 192.83142730132906, 0.5147317579785002], "isController": false}, {"data": ["GET Stats classes", 1000, 86, 8.6, 14228.663999999999, 1, 85153, 1980.0, 55774.9, 64870.349999999926, 75190.97, 1.5252226062393806, 2.6311341116798497, 0.4888517190021383], "isController": false}, {"data": ["GET Schedule current week", 1000, 37, 3.7, 3608.652000000001, 1, 89262, 464.0, 2802.0, 30260.149999999987, 65443.08000000001, 1.5262468673783047, 1.453246360473564, 0.5234788279034557], "isController": false}, {"data": ["GET Grades (all)", 1000, 40, 4.0, 29498.44100000001, 0, 151119, 15640.5, 72987.19999999998, 99487.7, 125562.77, 1.523435774232912, 23248.5894085651, 0.5010333298230835], "isController": false}, {"data": ["GET Ping", 1000, 26, 2.6, 7713.69900000001, 1, 89150, 1021.5, 37641.399999999994, 54690.74999999997, 75329.63, 1.526253855698803, 0.48048975387630327, 0.4983248648502211], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 1, 0.23255813953488372, 0.0125], "isController": false}, {"data": ["Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to localhost:5050 [localhost/127.0.0.1, localhost/0:0:0:0:0:0:0:1] failed: Operation timed out", 285, 66.27906976744185, 3.5625], "isController": false}, {"data": ["401/Unauthorized", 144, 33.48837209302326, 1.8], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 8000, 430, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to localhost:5050 [localhost/127.0.0.1, localhost/0:0:0:0:0:0:0:1] failed: Operation timed out", 285, "401/Unauthorized", 144, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 1, "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["GET Classes", 1000, 65, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to localhost:5050 [localhost/127.0.0.1, localhost/0:0:0:0:0:0:0:1] failed: Operation timed out", 37, "401/Unauthorized", 28, "", "", "", "", "", ""], "isController": false}, {"data": ["GET Grades student stats", 1000, 113, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to localhost:5050 [localhost/127.0.0.1, localhost/0:0:0:0:0:0:0:1] failed: Operation timed out", 86, "401/Unauthorized", 27, "", "", "", "", "", ""], "isController": false}, {"data": ["POST Login", 1000, 28, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to localhost:5050 [localhost/127.0.0.1, localhost/0:0:0:0:0:0:0:1] failed: Operation timed out", 27, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Connection reset", 1, "", "", "", "", "", ""], "isController": false}, {"data": ["GET Notifications", 1000, 35, "401/Unauthorized", 23, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to localhost:5050 [localhost/127.0.0.1, localhost/0:0:0:0:0:0:0:1] failed: Operation timed out", 12, "", "", "", "", "", ""], "isController": false}, {"data": ["GET Stats classes", 1000, 86, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to localhost:5050 [localhost/127.0.0.1, localhost/0:0:0:0:0:0:0:1] failed: Operation timed out", 58, "401/Unauthorized", 28, "", "", "", "", "", ""], "isController": false}, {"data": ["GET Schedule current week", 1000, 37, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to localhost:5050 [localhost/127.0.0.1, localhost/0:0:0:0:0:0:0:1] failed: Operation timed out", 22, "401/Unauthorized", 15, "", "", "", "", "", ""], "isController": false}, {"data": ["GET Grades (all)", 1000, 40, "401/Unauthorized", 23, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to localhost:5050 [localhost/127.0.0.1, localhost/0:0:0:0:0:0:0:1] failed: Operation timed out", 17, "", "", "", "", "", ""], "isController": false}, {"data": ["GET Ping", 1000, 26, "Non HTTP response code: org.apache.http.conn.HttpHostConnectException/Non HTTP response message: Connect to localhost:5050 [localhost/127.0.0.1, localhost/0:0:0:0:0:0:0:1] failed: Operation timed out", 26, "", "", "", "", "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
