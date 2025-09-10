import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { getMember } from '../handlers/get_member';

describe('getMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a member by id', async () => {
    // Create a test member first
    const testMember = await db.insert(membersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        date_of_birth: '1990-05-15',
        emergency_contact_name: 'Jane Doe',
        emergency_contact_phone: '+1234567891',
        medical_conditions: 'None',
      })
      .returning()
      .execute();

    const memberId = testMember[0].id;

    // Test getting the member
    const result = await getMember(memberId);

    expect(result.id).toEqual(memberId);
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone).toEqual('+1234567890');
    expect(result.date_of_birth).toEqual(new Date('1990-05-15'));
    expect(result.emergency_contact_name).toEqual('Jane Doe');
    expect(result.emergency_contact_phone).toEqual('+1234567891');
    expect(result.medical_conditions).toEqual('None');
    expect(result.join_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should get member with minimal required data', async () => {
    // Create a member with only required fields
    const testMember = await db.insert(membersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        // All other fields are nullable or have defaults
      })
      .returning()
      .execute();

    const memberId = testMember[0].id;

    const result = await getMember(memberId);

    expect(result.id).toEqual(memberId);
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.phone).toBeNull();
    expect(result.date_of_birth).toBeNull();
    expect(result.emergency_contact_name).toBeNull();
    expect(result.emergency_contact_phone).toBeNull();
    expect(result.medical_conditions).toBeNull();
    expect(result.join_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent member', async () => {
    const nonExistentId = 999999;

    await expect(getMember(nonExistentId))
      .rejects
      .toThrow(/Member with id 999999 not found/i);
  });

  it('should handle member with special characters in data', async () => {
    // Test with special characters and unicode
    const testMember = await db.insert(membersTable)
      .values({
        first_name: 'José',
        last_name: "O'Connor",
        email: 'jose.oconnor@example.com',
        phone: '+1 (555) 123-4567',
        emergency_contact_name: 'María José',
        medical_conditions: 'Allergic to nuts & shellfish',
      })
      .returning()
      .execute();

    const memberId = testMember[0].id;

    const result = await getMember(memberId);

    expect(result.first_name).toEqual('José');
    expect(result.last_name).toEqual("O'Connor");
    expect(result.phone).toEqual('+1 (555) 123-4567');
    expect(result.emergency_contact_name).toEqual('María José');
    expect(result.medical_conditions).toEqual('Allergic to nuts & shellfish');
  });

  it('should verify correct date handling', async () => {
    const specificDate = '1985-12-25';
    
    const testMember = await db.insert(membersTable)
      .values({
        first_name: 'Test',
        last_name: 'User',
        email: 'test.user@example.com',
        date_of_birth: specificDate,
      })
      .returning()
      .execute();

    const memberId = testMember[0].id;

    const result = await getMember(memberId);

    expect(result.date_of_birth).toBeInstanceOf(Date);
    expect(result.date_of_birth).toEqual(new Date(specificDate));
    expect(result.join_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });
});