import container from '../model/DiContainer';
import { TestHelper } from './TestHelper';

describe("Transport Manager Tests", () => {

  let th: TestHelper;

  beforeEach(async () => {
    th = await TestHelper.new();
  });

  afterEach(async () => {
    await th.shutdown();
  });

  it("gets Transports", async () => {
    //Active transports
    const active = await container.tm.get();
    expect(active.length).toBe(3);

    //All transports
    const all = await container.tm.get(false);
    expect(all.length).toBe(4);
  });

  it("gets weighted Transport", async () => {
    const counter = {
      1: { id: 1, count: 0 },
      2: { id: 2, count: 0 },
      3: { id: 3, count: 0 },
      4: { id: 4, count: 0 },
    };
    for (let i = 0; i < 100; i++) {
      const t = await container.tm.getTransport();
      counter[t.id].count++;
    }

    const sorted = Object.values(counter).sort((a, b) => b.count - a.count);
    expect(sorted[0].id).toBe(2, "Transport 2 has a weight of 30");
    expect(sorted[1].id).toBe(3, "Transport 3 has a weight of 15");
    expect(sorted[2].id).toBe(1, "Transport 1 has a weight of 5");
    expect(sorted[3].id).toBe(4, "Transport 1 has a weight of 50, but is disabled");
    expect(sorted[3].count).toBe(0);
  });

  it("gets Transport with ID", async () => {
    const t = await container.tm.getTransport(1);
    expect(t.id).toBe(1);
  });

  it("gets Transport, no weights", async () => {
    await container.db.query("UPDATE transport SET weight = 0");

    const t = await container.tm.getTransport();
    expect(t.id).toBe(3, "Transport 3 is the default");
  });

  it("Import Settings", async () => {
    await container.db.query("DELETE FROM transport");
    await container.tm.reloadTransports();

    const t = await container.tm.get(true);
    expect(t.length).toBeGreaterThanOrEqual(2);
  });
})