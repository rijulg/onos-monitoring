#!/usr/bin/env python

import asyncio
import websockets
import json
import requests
from datetime import datetime
from random import random

timestamps = []
statistics = {}

def now():
    return datetime.now().strftime("%X")

def addMissingKeysToStats(devices):
    for device in devices:
        devKey = device['device']
        if devKey not in statistics:
            statistics[devKey] = {}
        for port in device["ports"]:
            portKey = port['port']
            if portKey not in statistics[devKey]:
                statistics[devKey][portKey] = {}
            if 'packetsSent' not in statistics[devKey][portKey]:
                statistics[devKey][portKey]['packetsSent'] = []
            if 'packetsReceived' not in statistics[devKey][portKey]:
                statistics[devKey][portKey]['packetsReceived'] = []
            if 'bytesSent' not in statistics[devKey][portKey]:
                statistics[devKey][portKey]['bytesSent'] = []
            if 'bytesReceived' not in statistics[devKey][portKey]:
                statistics[devKey][portKey]['bytesReceived'] = []
            if 'packetsRxDropped' not in statistics[devKey][portKey]:
                statistics[devKey][portKey]['packetsRxDropped'] = []
            if 'packetsTxDropped' not in statistics[devKey][portKey]:
                statistics[devKey][portKey]['packetsTxDropped'] = []
            if 'packetsRxErrors' not in statistics[devKey][portKey]:
                statistics[devKey][portKey]['packetsRxErrors'] = []
            if 'packetsTxErrors' not in statistics[devKey][portKey]:
                statistics[devKey][portKey]['packetsTxErrors'] = []

def getData():
    timestamps.append(now())
    r = requests.get('http://172.17.0.2:8181/onos/v1/statistics/ports', auth=('onos','rocks'))
    devices = r.json()["statistics"]
    addMissingKeysToStats(devices)
    for device in devices:
        devKey = device['device']
        for port in device["ports"]:
            portKey = port['port']
            statistics[devKey][portKey]['timestamps'] = timestamps
            statistics[devKey][portKey]['packetsSent'].append(port['packetsSent'])
            statistics[devKey][portKey]['packetsReceived'].append(port['packetsReceived'])
            statistics[devKey][portKey]['bytesSent'].append(port['bytesSent'])
            statistics[devKey][portKey]['bytesReceived'].append(port['bytesReceived'])
            statistics[devKey][portKey]['packetsRxDropped'].append(port['packetsRxDropped'])
            statistics[devKey][portKey]['packetsTxDropped'].append(port['packetsTxDropped'])
            statistics[devKey][portKey]['packetsRxErrors'].append(port['packetsRxErrors'])
            statistics[devKey][portKey]['packetsTxErrors'].append(port['packetsTxErrors'])


def formatData():
    data = []
    for dkey, dval in statistics.items():
        device = {}
        ports = []
        for pkey, pval in dval.items():
            port = {}
            port['id'] = pkey
            for key, val in pval.items():
                port[key] = val
            ports.append(port)
        device['id'] = dkey
        device['ports'] = ports
        data.append(device)
    return json.dumps(data)

def data():
    getData()
    return formatData()

async def socketLoop(websocket, path):
    while True:
        await websocket.send(data())
        await asyncio.sleep(5)

start_server = websockets.serve(socketLoop, '127.0.0.1', 5678)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()