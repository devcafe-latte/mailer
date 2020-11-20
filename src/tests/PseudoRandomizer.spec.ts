import { PseudoRandomizer } from '../model/PseudoRandomizer';

describe("Pseudo Randomizer Tests", () => {

  let rand = new PseudoRandomizer();
  it("tests seeding, different numbers", () => {
    rand.seed(1);
    const numbers = [
      rand.number(10000),
      rand.number(10000),
      rand.number(10000),
      rand.number(10000),
      rand.number(10000)
    ];

    //If there are duplicate numbes, set will remove them. 
    const set = new Set(numbers);
    expect(numbers).toEqual([...set], "If 'set' is smaller, duplicates have been found.");
  });

  it("tests seeding, same numbers", () => {
    const sameNumbers = [];
    for (let i = 0; i < 10; i++) {
      rand.seed(1);
      sameNumbers.push(rand.number(10000));
    }

    const set = new Set(sameNumbers);
    expect(set.size).toEqual(1, "'set' should be of length 1. That means all numbers were the same.");
  });

  it("tests number", () => {
    for (let i = 0; i < 100; i++) {
      const n = rand.number(10);
      expect(n).toBeGreaterThan(-1);
      expect(n).toBeLessThan(10);
    }
  });

  it("tests Decimal", () => {
    const decimalCounts = [0, 0, 0];

    for (let i = 0; i < 100; i++) {
      const decAmount = 2;

      const n = rand.decimal(0, 10, decAmount);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(10);

      const parts = String(n).split('.');
      if (parts.length === 1) {
        decimalCounts[0]++;
        continue;
      } 
      expect(parts.length).toBe(2, `Expected ${n} to have at least 1 decimal. (Iteration ${i})`);

      const decimals = parts[1];
      decimalCounts[decimals.length]++;
      expect(decimals.length).toBeLessThanOrEqual(decAmount, "Too many decimals!");

    }

    expect(decimalCounts[0]).toBeGreaterThan(0, "Expected at least 1 round number");
    expect(decimalCounts[1]).toBeGreaterThan(0, "Expected at least 1 number with 1 decimal");
    expect(decimalCounts[2]).toBeGreaterThan(0, "Expected at least 1 number with 2 decimals");
  });

  it("tests text", () => {
    const one = rand.text(1);
    expect(one.split(" ").length).toBe(1);

    const five = rand.text(5);
    expect(five.split(" ").length).toBe(5);

    const many = rand.text(10000);
    expect(many.split(" ").length).toBe(10000);
  });

  /* 
  it("tests something", () => {
    
  });
 */


});