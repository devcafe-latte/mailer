import { DataGenerator } from '../model/DataGenerator';
describe("Data Generator Tests", () => {

  let dg = new DataGenerator();
  it("tests Email", () => {
    const m = dg.getEmail();

    expect(m.text.length).toBeGreaterThan(5);
  });

});