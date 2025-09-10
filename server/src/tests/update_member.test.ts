import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { type UpdateMemberInput, type CreateMemberInput } from '../schema';
import { updateMember } from '../handlers/update_member';
import { eq } from 'drizzle-orm';

// Helper function to create a test member
const createTestMember = async (memberData: CreateMemberInput) => {
  const result = await db.insert(membersTable)
    .values({
      first_name: memberData.first_name,
      last_name: memberData.last_name,
      email: memberData.email,
      phone: memberData.phone,
      date_of_birth: memberData.date_of_birth ? memberData.date_of_birth.toISOString().split('T')[0] : null,
      emergency_contact_name: memberData.emergency_contact_name,
      emergency_contact_phone: memberData.emergency_contact_phone,
      medical_conditions: memberData.medical_conditions,
    })
    .returning()
    .execute();
  
  const member = result[0];
  
  // Convert date strings back to Date objects for consistency
  return {
    ...member,
    date_of_birth: member.date_of_birth ? new Date(member.date_of_birth) : null,
    join_date: new Date(member.join_date),
    created_at: new Date(member.created_at),
  };
};

// Test data
const testMemberData: CreateMemberInput = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-1234',
  date_of_birth: new Date('1990-01-15'),
  emergency_contact_name: 'Jane Doe',
  emergency_contact_phone: '555-5678',
  medical_conditions: 'None',
};

describe('updateMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update member with all fields', async () => {
    const member = await createTestMember(testMemberData);
    
    const updateInput: UpdateMemberInput = {
      id: member.id,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone: '555-9999',
      date_of_birth: new Date('1985-05-20'),
      emergency_contact_name: 'John Smith',
      emergency_contact_phone: '555-8888',
      medical_conditions: 'Allergies',
    };

    const result = await updateMember(updateInput);

    expect(result.id).toEqual(member.id);
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.phone).toEqual('555-9999');
    expect(result.date_of_birth).toEqual(new Date('1985-05-20'));
    expect(result.emergency_contact_name).toEqual('John Smith');
    expect(result.emergency_contact_phone).toEqual('555-8888');
    expect(result.medical_conditions).toEqual('Allergies');
    expect(result.join_date).toEqual(member.join_date);
    expect(result.created_at).toEqual(member.created_at);
  });

  it('should update only specified fields', async () => {
    const member = await createTestMember(testMemberData);
    
    const updateInput: UpdateMemberInput = {
      id: member.id,
      first_name: 'UpdatedFirstName',
      email: 'updated@example.com',
    };

    const result = await updateMember(updateInput);

    expect(result.id).toEqual(member.id);
    expect(result.first_name).toEqual('UpdatedFirstName');
    expect(result.last_name).toEqual('Doe'); // Should remain unchanged
    expect(result.email).toEqual('updated@example.com');
    expect(result.phone).toEqual('555-1234'); // Should remain unchanged
    expect(result.date_of_birth).toEqual(new Date('1990-01-15')); // Should remain unchanged
  });

  it('should update nullable fields to null', async () => {
    const member = await createTestMember(testMemberData);
    
    const updateInput: UpdateMemberInput = {
      id: member.id,
      phone: null,
      date_of_birth: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      medical_conditions: null,
    };

    const result = await updateMember(updateInput);

    expect(result.id).toEqual(member.id);
    expect(result.phone).toBeNull();
    expect(result.date_of_birth).toBeNull();
    expect(result.emergency_contact_name).toBeNull();
    expect(result.emergency_contact_phone).toBeNull();
    expect(result.medical_conditions).toBeNull();
    // Non-updated fields should remain the same
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.email).toEqual('john.doe@example.com');
  });

  it('should persist changes to database', async () => {
    const member = await createTestMember(testMemberData);
    
    const updateInput: UpdateMemberInput = {
      id: member.id,
      first_name: 'DatabaseTest',
      email: 'database.test@example.com',
    };

    await updateMember(updateInput);

    // Query database directly to verify persistence
    const updatedMember = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, member.id))
      .execute();

    expect(updatedMember).toHaveLength(1);
    expect(updatedMember[0].first_name).toEqual('DatabaseTest');
    expect(updatedMember[0].email).toEqual('database.test@example.com');
    expect(updatedMember[0].last_name).toEqual('Doe'); // Should remain unchanged
  });

  it('should throw error when member does not exist', async () => {
    const updateInput: UpdateMemberInput = {
      id: 99999, // Non-existent ID
      first_name: 'NonExistent',
    };

    await expect(updateMember(updateInput)).rejects.toThrow(/Member with id 99999 not found/i);
  });

  it('should handle email uniqueness constraint', async () => {
    // Create two members
    const member1 = await createTestMember(testMemberData);
    const member2Data = {
      ...testMemberData,
      email: 'member2@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
    };
    const member2 = await createTestMember(member2Data);

    // Try to update member2 with member1's email
    const updateInput: UpdateMemberInput = {
      id: member2.id,
      email: member1.email, // This should violate uniqueness
    };

    await expect(updateMember(updateInput)).rejects.toThrow();
  });

  it('should update member with mixed null and non-null values', async () => {
    const member = await createTestMember({
      ...testMemberData,
      phone: null,
      date_of_birth: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      medical_conditions: null,
    });
    
    const updateInput: UpdateMemberInput = {
      id: member.id,
      first_name: 'MixedUpdate',
      phone: '555-0000',
      date_of_birth: new Date('1992-12-25'),
      emergency_contact_name: 'Emergency Contact',
      // Leave emergency_contact_phone and medical_conditions as they were (null)
    };

    const result = await updateMember(updateInput);

    expect(result.id).toEqual(member.id);
    expect(result.first_name).toEqual('MixedUpdate');
    expect(result.phone).toEqual('555-0000');
    expect(result.date_of_birth).toEqual(new Date('1992-12-25'));
    expect(result.emergency_contact_name).toEqual('Emergency Contact');
    expect(result.emergency_contact_phone).toBeNull();
    expect(result.medical_conditions).toBeNull();
  });
});