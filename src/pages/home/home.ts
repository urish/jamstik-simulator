import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { DeviceProvider } from './../../providers/device/device';

const stringTuning = [64, 59, 55, 50, 45, 40];

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  frets = [0, 1, 2, 3, 4, 5];
  strings = [0, 1, 2, 3, 4, 5];

  private activeNotes = new Set<string>();

  constructor(public navCtrl: NavController, private device: DeviceProvider) {
    document.addEventListener('deviceready', () => {
      device.start();
    }, false);
  }

  play(fret: number, stringId: number) {
    const id = `${fret}/${stringId}`;
    const pitch = stringTuning[stringId] + fret;
    this.activeNotes.add(id);
    this.device.noteOn(stringId, pitch);
    setTimeout(() => {
      this.device.noteOff(stringId, pitch);
      this.activeNotes.delete(id);
    }, 300);
  }

  isActive(fret: number, stringId: number) {
    const id = `${fret}/${stringId}`;
    return this.activeNotes.has(id);
  }

  get connected() {
    return this.device.connected;
  }
}
