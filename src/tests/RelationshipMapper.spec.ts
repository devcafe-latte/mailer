import { RelationshipMapper } from '../model/database/RelationshipMapper';
import { SqlResult } from '../model/database/SqlResults';

describe("Test the RelationshipMapper", () => {

  let rows: any[];
  let result: SqlResult;


  beforeEach(() => {
    rows = [
      { u: { id: 1, organizationId: 1, username: 'Jack' }, o: { id: 1, name: 'Covle' } },
      { u: { id: 2, organizationId: 2, username: 'Jill' }, o: { id: 2, name: 'Sanchez Inc' } },
      { u: { id: 3, organizationId: 1, username: 'Bruce' }, o: { id: 1, name: 'Covle' } },
      { u: { id: 4, organizationId: 3, username: 'Morty' }, o: { id: 3, name: 'Tesla' } },
      { u: { id: null, organizationId: null, username: null }, o: { id: 4, name: 'Water Bottle LTD' } },
    ];

    result = SqlResult.new(rows);

  });
  
  it ("Put the organization in the users", async() => {
    const rm = RelationshipMapper.put('o', result)
      .into('u', 'organization')
      .on('organizationId');

    const user1: any = result.get('u', 1);
    expect(user1.organization.name).toBe('Covle');

    const user2: any = result.get('u', 2);
    expect(user2.organization.name).toBe('Sanchez Inc');

    const user3: any = result.get('u', 3);
    expect(user3.organization.name).toBe('Covle');

    const user4: any = result.get('u', 4);
    expect(user4.organization.name).toBe('Tesla');
  });

  it ("Put the users in the organizations", async() => {
    const rm = RelationshipMapper.put('u', result)
      .into('o', 'users')
      .on('organizationId');

    const org1: any = result.get('o', 1);
    expect(org1.name).toBe('Covle');
    expect(org1.users.length).toBe(2);
    expect(org1.users[0].username).toBe('Jack');

    const org2: any = result.get('o', 2);
    expect(org2.name).toBe('Sanchez Inc');
    expect(org2.users.length).toBe(1);
    expect(org2.users[0].username).toBe('Jill');

    const org3: any = result.get('o', 3);
    expect(org3.name).toBe('Tesla');
    expect(org3.users.length).toBe(1);
    expect(org3.users[0].username).toBe('Morty');

    const org4: any = result.get('o', 4);
    expect(org4.name).toBe('Water Bottle LTD');
    expect(org4.users.length).toBe(0);

  });

  it("Tests on(source, dest)", () => {

    const rows = [
      { u: { id: 1, uuid: "12345-123456-00001", username: 'Jack' }, i: { userUuid: "12345-123456-00001", id: 1, name: 'Import 1' } },
      { u: { id: 1, uuid: "12345-123456-00001", username: 'Jack' }, i: { userUuid: "12345-123456-00001", id: 2, name: 'Import 2' } },
      { u: { id: 2, uuid: "12345-123456-00003", username: 'Bruce' }, i: { userUuid: "12345-123456-00003", id: 3, name: 'Import 3' } },
      { u: { id: 3, uuid: "12345-123456-00004", username: 'Morty' }, i: { userUuid: "12345-123456-00004", id: 4, name: 'Import 4' } },
      { u: { id: null, uuid: null, username: null }, i: { userUuid: null, id: 5, name: 'Import 5' } },
    ];

    const result = SqlResult.new(rows);

    result.put('u').into('i', 'user').on('userUuid', 'uuid');
    result.put('i').into('u', 'imports').on('userUuid','uuid');

    const imports = result.get<any>('i');
    expect(imports.length).toBe(5);
    expect(imports[0].user).toBeDefined();
    expect(imports[1].user).toBeDefined();
    expect(imports[2].user).toBeDefined();
    expect(imports[3].user).toBeDefined();
    expect(imports[4].user).toBeUndefined();

    const users = result.get<any>('u');
    expect(users.length).toBe(3);
    
    expect(users[0].imports.length).toBe(2);
    expect(users[1].imports.length).toBe(1);
    expect(users[2].imports.length).toBe(1);
    
  });
});