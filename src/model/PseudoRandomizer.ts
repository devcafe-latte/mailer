import seedrandom, { prng } from 'seedrandom';
import uuid from 'uuid';
import { Moment } from 'moment';
import moment from 'moment';
import hasha from 'hasha';

export class PseudoRandomizer {
  private _rand: prng;

  constructor() { 
    this.seed(1);
  }

  seed(seed: string | number) {
    this._rand = seedrandom(String(seed));
  }

  uuid(): string {
    return uuid.v4({ "random": [this.number(0, 255), this.number(0, 255), this.number(0, 255), this.number(0, 255), this.number(0, 255), this.number(0, 255), this.number(0, 255), this.number(0, 255), this.number(0, 255), this.number(0, 255), this.number(0, 255), this.number(0, 255), this.number(0, 255), this.number(0, 255), this.number(0, 255), this.number(0, 255)] });
  }

  md5(): string {
    return hasha(this.uuid(), { algorithm: "md5" });
  }

  bool(): boolean {
    return this.number(1) === 0;
  }

  date(): Moment {
    return moment()
      .startOf('day')
      .set('month', this.number(1, 12))
      .set('day', this.number(1, 28));
  }

  decimal(min: number, max: number, decimals = 2) {
    const factor = Math.pow(10, decimals);

    const n = this.number(min * factor, max * factor);
    return n / factor;
  }

  number(max: number): number;
  number(min: number, max: number): number;
  number(minOrMax: number, max?: number): number {
    let min = 0;
    if (max) {
      min = minOrMax
    } else {
      max = minOrMax;
    }
    const diff = max - min;

    return Math.floor((this._rand() * diff) + min);
  }

  text(words = 50): string {
    if (words > 100000) {
      throw "Too many words!";
    }

    //Note the .split at the end.
    const input = "Minions ipsum tatata bala tu poulet tikka masala la bodaaa tulaliloo poopayee. Bee do bee do bee do tank yuuu! Gelatooo butt gelatooo. Bappleees poulet tikka masala la bodaaa wiiiii daa jiji bee do bee do bee do baboiii ti aamoo! Po kass bananaaaa. La bodaaa chasy pepete bappleees uuuhhh butt jiji daa. Daa potatoooo hahaha hana dul sae poulet tikka masala jeje bappleees potatoooo. Me want bananaaa! tulaliloo la bodaaa hahaha.".split(' ');
    
    let current = this.number(0, input.length -1);

    const output = [];
    let count = 0;
    while (count < words) {
      output.push(input[current % input.length]);
      count++;
      current++;
    }

    return output.join(" ");

  }
}