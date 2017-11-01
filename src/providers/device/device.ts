import { Injectable, NgZone } from '@angular/core';

declare var bluetoothle;

const MIDI_SERVICE = '03b80e5a-ede8-4b33-a751-6ce34ec4c700';
const MIDI_CHARACTERISTIC = '7772e5db-3868-4112-a1a9-f2669d106bf3';

@Injectable()
export class DeviceProvider {
  remoteAddress: string | null = null;

  constructor(private zone: NgZone) {
  }

  start() {
    if (typeof bluetoothle !== 'undefined') {
      bluetoothle.initialize(result => this.onBleReady(result), {
        request: true
      });
    } else {
      console.error('Please install cordova-plugin-bluetoothle');
    }
  }

  get connected() {
    return this.remoteAddress !== null;
  }

  sendMidiMessage(timestamp: number, status: number, data1: number, data2: number) {
    if (!this.remoteAddress) {
      console.error('Unable to send midi message: not connected');
      return;
    }

    let header = 0x80 | ((timestamp >> 7) & 0x3f);
    let byte2 = 0x80 | (timestamp & 0x7f);

    bluetoothle.notify(
      result => console.log('notify result', result),
      error => console.error('notify failed', error), {
        address: this.remoteAddress,
        service: MIDI_SERVICE,
        characteristic: MIDI_CHARACTERISTIC,
        value: bluetoothle.bytesToEncodedString([header, byte2, status, data1, data2])
      });
  }

  noteOn(channel: number, note: number, velocity: number = 127) {
    this.sendMidiMessage(0, 0x90 | (channel & 0xf), note, velocity);
  }

  noteOff(channel: number, note: number) {
    this.sendMidiMessage(0, 0x80 | (channel & 0xf), note, 0);
  }

  private onBleReady(result) {
    console.log('onBleReady', result);
    bluetoothle.initializePeripheral(status => this.zone.run(() => this.bleCallback(status)), err => this.onError(err), {
      request: true
    });
  }

  private bleCallback(event) {
    console.log('BLE callback', event);
    if (event.status === 'enabled') {
      bluetoothle.addService(result => console.log('ok', result), err => console.log('failed!', err), {
        service: MIDI_SERVICE,
        characteristics: [
          {
            uuid: MIDI_CHARACTERISTIC,
            permissions: {
              read: true
            },
            properties: {
              read: true,
              notify: true
            }
          }
        ]
      });

      bluetoothle.startAdvertising(result => console.log('advertising', result), err => console.error('advertising failed', err), {
        services: [MIDI_SERVICE],
        service: MIDI_SERVICE,
        name: 'JAMSTIK-SIM',
        mode: 'lowLatency',
        connectable: true,
        timeout: 180000,
        powerLevel: 'high'
      });
    }
    if (event.status === 'writeRequested') {
      console.log('write request ignored');
    }
    if (event.status === 'subscribed') {
      this.remoteAddress = event.address;
    }
    if (event.status === 'disconnected') {
      this.remoteAddress = null;
    }
  }

  private onError(err) {
    console.log('BLE error', err);
  }
}
