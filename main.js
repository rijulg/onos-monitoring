'use strict';

const charts = {};
const timestamps = [];

let uri = "";

const chartColors = {
	red: 'rgb(255, 99, 132)',
	orange: 'rgb(255, 159, 64)',
	yellow: 'rgb(255, 205, 86)',
	green: 'rgb(75, 192, 192)',
	blue: 'rgb(54, 162, 235)',
	purple: 'rgb(153, 102, 255)',
	grey: 'rgb(201, 203, 207)'
};

/**
 * main.js
 * The JS file that handles the generation of charts from the data received from the websocket
 */

/**
 * formatForChart
 * formats the given data into datasets used by Chart.js
 * @param {[Number]} packetsSent
 * @param {[Number]} packetsReceived
 * @param {[Number]} bytesSent
 * @param {[Number]} bytesReceived
 * @param {[Number]} packetsRxDropped
 * @param {[Number]} packetsTxDropped
 * @param {[Number]} packetsRxErrors
 * @param {[Number]} packetsTxErrors
 * @return {[{}]} formatted chart data
 */
function formatForChart(
    packetsSent,
    packetsReceived,
    bytesSent,
    bytesReceived,
    packetsRxDropped,
    packetsTxDropped,
    packetsRxErrors,
    packetsTxErrors,    
){

    const datasets = [];
    let data;
    if (packetsSent && packetsSent.length > 0) {
        data = {
            label: 'Packets Sent',
            fill: false,
            backgroundColor: chartColors.blue,
            borderColor: chartColors.blue,
            data: packetsSent,
        }
        datasets.push(data);
    }
    if (packetsReceived && packetsReceived.length > 0) {
        data = {
            label: 'Packets Received',
            fill: false,
            backgroundColor: chartColors.green,
            borderColor: chartColors.green,
            data: packetsReceived,
        }
        datasets.push(data);
    }
    if (bytesSent && bytesSent.length > 0) {
        data = {
            label: 'Bytes Sent',
            fill: false,
            backgroundColor: chartColors.red,
            borderColor: chartColors.red,
            data: bytesSent,
        }
        datasets.push(data);
    }
    if (bytesReceived && bytesReceived.length > 0) {
        data = {
            label: 'Bytes Received',
            fill: false,
            backgroundColor: chartColors.orange,
            borderColor: chartColors.orange,
            data: bytesReceived,
        }
        datasets.push(data);
    }
    if (packetsRxDropped && packetsRxDropped.length > 0) {
        data = {
            label: 'packets RX Dropped',
            fill: false,
            backgroundColor: chartColors.purple,
            borderColor: chartColors.purple,
            data: packetsRxDropped,
        }
        datasets.push(data);
    }
    if (packetsTxDropped && packetsTxDropped.length > 0) {
        data = {
            label: 'packets TX Dropped',
            fill: false,
            backgroundColor: chartColors.yellow,
            borderColor: chartColors.yellow,
            data: packetsTxDropped,
        }
        datasets.push(data);
    }
    if (packetsRxErrors && packetsRxErrors.length > 0) {
        data = {
            label: 'packets Rx Errors',
            fill: false,
            backgroundColor: chartColors.grey,
            borderColor: chartColors.grey,
            data: packetsRxErrors,
        }
        datasets.push(data);
    }
    if (packetsTxErrors && packetsTxErrors.length > 0) {
        data = {
            label: 'packets Tx Errors',
            fill: false,
            backgroundColor: chartColors.grey,
            borderColor: chartColors.grey,
            data: packetsTxErrors,
        }
        datasets.push(data);
    }
    return datasets;
}

/**
 * addChart
 * adds a chart with given data to the given HTML dom element
 * @param {Object} el HTML dom to add the chart to
 * @param {String} deviceId the id of the device
 * @param {Object} data the data to be added to the chart
 */
function addChart(el, deviceId, {
    id,
    timestamps,
    packetsSent,
    packetsReceived,
    bytesSent,
    bytesReceived,
    packetsRxDropped,
    packetsTxDropped,
    packetsRxErrors,
    packetsTxErrors,
}) {
    if (!el) {
        console.error('Missing HTML Dom element for charting');
        return;
    }
    const labels = timestamps ? timestamps: [];
    const formattedData = formatForChart(
        packetsSent,
        packetsReceived,
        bytesSent,
        bytesReceived,
        packetsRxDropped,
        packetsTxDropped,
        packetsRxErrors,
        packetsTxErrors,        
    );
    const key = `${deviceId}:${id}`;
    if (charts[key]){
        charts[key].data.labels = labels;
        charts[key].data.datasets = formattedData;
        charts[key].update(0);
        return 0;
    }
    el.id = key;
    charts[key] = new Chart(el, {
        type: 'line',
        data: {
            labels: labels,
            datasets: formattedData,
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: id ? id : 'Unknown port'
            },
            tooltips: {
                mode: 'index',
                intersect: false,
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Time'
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Value'
                    }
                }]
            },
        }
    });
    return 1;
}

/**
 * generateElements
 * generates elements to be charted into based on the received data from websockets
 * @param {Object} data the data received from the websocket
 */
function generateCharts(data) {
    if (!data) {
        console.error('Missing data');
        return;
    }
    data = JSON.parse(data);
    const container = document.getElementById('container');
    const table = document.createElement('div');
    let flag = 0;
    for (let device of data){
        let row = document.createElement('div');
        row.className = 'device';
        let heading = document.createElement('h2');
        const { id } = device;
        heading.innerText = id;
        row.appendChild(heading);
        const { ports } = device;
        for (let port of ports) {
            let portEl = document.createElement('div');
            portEl.className = 'port';
            let portChart = document.createElement('canvas');
            flag += addChart(portChart, id, port);
            portEl.appendChild(portChart);
            row.appendChild(portEl);
        }
        table.appendChild(row);
    }
    if(flag === 0){
        return;
    }
    cleanContainer();
    container.appendChild(table);
}

/**
 * cleanContainer
 * cleans the container used for charting
 */
function cleanContainer(){
    const container = document.getElementById('container');
    container.innerHTML="";
}

/**
 * main
 * the main function that starts the program
 * @param {String} uri the request uri
 */
function main(uri) {
    if (!uri) {
        console.error('Missing websocket URI');
        return;
    }
    var ws = new WebSocket(`ws://${uri}/`);
    ws.onmessage = function (event) {
        const { data } = event;
        generateCharts(data);
    };
}