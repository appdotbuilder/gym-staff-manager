import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, type NewMember } from '../db/schema';
import { getMembers } from '../handlers/get_members';

// Test member data - using database insert types
const testMember1: NewMember = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-0123',
  date_of_birth: '1990-01-15',
  emergency_contact_name: 'Jane Doe',
  emergency_contact_phone: '555-0456',
  medical_conditions: 'None'
};

const testMember2: NewMember = {
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane.smith@example.com',
  phone: null,
  date_of_birth: null,
  emergency_contact_name: null,
  emergency_contact_phone: null,
  medical_conditions: null
};

const testMember3: NewMember = {
  first_name: 'Bob',
  last_name: 'Johnson',
  email: 'bob.johnson@example.com',
  phone: '555-7890',
  date_of_birth: '1985-03-22',
  emergency_contact_name: 'Alice Johnson',
  emergency_contact_phone: '555-2468',
  medical_conditions: 'Diabetes'
};

describe('getMembers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no members exist', async () => {
    const result = await getMembers();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all members from database', async () => {
    // Create test members
    await db.insert(membersTable)
      .values([testMember1, testMember2, testMember3])
      .execute();

    const result = await getMembers();

    expect(result).toHaveLength(3);
    
    // Sort by email to ensure consistent order
    const sortedResult = result.sort((a, b) => a.email.localeCompare(b.email));

    // Verify first member
    expect(sortedResult[1].first_name).toEqual('Jane');
    expect(sortedResult[1].last_name).toEqual('Smith');
    expect(sortedResult[1].email).toEqual('jane.smith@example.com');
    expect(sortedResult[1].phone).toBeNull();
    expect(sortedResult[1].date_of_birth).toBeNull();
    expect(sortedResult[1].emergency_contact_name).toBeNull();

    // Verify second member
    expect(sortedResult[0].first_name).toEqual('Bob');
    expect(sortedResult[0].last_name).toEqual('Johnson');
    expect(sortedResult[0].email).toEqual('bob.johnson@example.com');
    expect(sortedResult[0].phone).toEqual('555-7890');
    expect(sortedResult[0].medical_conditions).toEqual('Diabetes');

    // Verify third member
    expect(sortedResult[2].first_name).toEqual('John');
    expect(sortedResult[2].last_name).toEqual('Doe');
    expect(sortedResult[2].email).toEqual('john.doe@example.com');
    expect(sortedResult[2].emergency_contact_name).toEqual('Jane Doe');
  });

  it('should include all expected fields for each member', async () => {
    await db.insert(membersTable)
      .values([testMember1])
      .execute();

    const result = await getMembers();

    expect(result).toHaveLength(1);
    const member = result[0];

    // Verify all required fields are present
    expect(member.id).toBeDefined();
    expect(typeof member.id).toBe('number');
    expect(member.first_name).toBeDefined();
    expect(member.last_name).toBeDefined();
    expect(member.email).toBeDefined();
    expect(member.join_date).toBeInstanceOf(Date);
    expect(member.created_at).toBeInstanceOf(Date);

    // Verify optional fields are handled correctly
    expect(member.phone).toEqual('555-0123');
    expect(member.date_of_birth).toBeInstanceOf(Date);
    expect(member.emergency_contact_name).toEqual('Jane Doe');
    expect(member.emergency_contact_phone).toEqual('555-0456');
    expect(member.medical_conditions).toEqual('None');
  });

  it('should handle members with null optional fields', async () => {
    await db.insert(membersTable)
      .values([testMember2])
      .execute();

    const result = await getMembers();

    expect(result).toHaveLength(1);
    const member = result[0];

    // Verify required fields
    expect(member.first_name).toEqual('Jane');
    expect(member.last_name).toEqual('Smith');
    expect(member.email).toEqual('jane.smith@example.com');

    // Verify null optional fields
    expect(member.phone).toBeNull();
    expect(member.date_of_birth).toBeNull();
    expect(member.emergency_contact_name).toBeNull();
    expect(member.emergency_contact_phone).toBeNull();
    expect(member.medical_conditions).toBeNull();
  });

  it('should return members in database insertion order', async () => {
    // Insert members in specific order
    await db.insert(membersTable)
      .values([testMember1])
      .execute();
    
    await db.insert(membersTable)
      .values([testMember2])
      .execute();

    await db.insert(membersTable)
      .values([testMember3])
      .execute();

    const result = await getMembers();

    expect(result).toHaveLength(3);
    
    // Members should be returned in order of their IDs (insertion order)
    expect(result[0].email).toEqual('john.doe@example.com');
    expect(result[1].email).toEqual('jane.smith@example.com');
    expect(result[2].email).toEqual('bob.johnson@example.com');

    // Verify IDs are sequential
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
  });
});