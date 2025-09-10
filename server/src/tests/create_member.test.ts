import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable } from '../db/schema';
import { type CreateMemberInput } from '../schema';
import { createMember } from '../handlers/create_member';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateMemberInput = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  date_of_birth: new Date('1990-01-15'),
  emergency_contact_name: 'Jane Doe',
  emergency_contact_phone: '+0987654321',
  medical_conditions: 'No known allergies',
};

// Minimal test input (only required fields)
const minimalInput: CreateMemberInput = {
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane.smith@example.com',
  phone: null,
  date_of_birth: null,
  emergency_contact_name: null,
  emergency_contact_phone: null,
  medical_conditions: null,
};

describe('createMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a member with all fields', async () => {
    const result = await createMember(testInput);

    // Verify all fields are correctly set
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone).toEqual('+1234567890');
    expect(result.date_of_birth).toBeInstanceOf(Date);
    expect(result.date_of_birth?.toDateString()).toEqual(new Date('1990-01-15').toDateString());
    expect(result.emergency_contact_name).toEqual('Jane Doe');
    expect(result.emergency_contact_phone).toEqual('+0987654321');
    expect(result.medical_conditions).toEqual('No known allergies');
    
    // Verify auto-generated fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.join_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a member with only required fields', async () => {
    const result = await createMember(minimalInput);

    // Verify required fields
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    
    // Verify nullable fields are null
    expect(result.phone).toBeNull();
    expect(result.date_of_birth).toBeNull();
    expect(result.emergency_contact_name).toBeNull();
    expect(result.emergency_contact_phone).toBeNull();
    expect(result.medical_conditions).toBeNull();

    // Verify auto-generated fields
    expect(result.id).toBeDefined();
    expect(result.join_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save member to database', async () => {
    const result = await createMember(testInput);

    // Query the database to verify the member was saved
    const members = await db.select()
      .from(membersTable)
      .where(eq(membersTable.id, result.id))
      .execute();

    expect(members).toHaveLength(1);
    const savedMember = members[0];
    
    expect(savedMember.first_name).toEqual('John');
    expect(savedMember.last_name).toEqual('Doe');
    expect(savedMember.email).toEqual('john.doe@example.com');
    expect(savedMember.phone).toEqual('+1234567890');
    expect(savedMember.date_of_birth).toEqual('1990-01-15'); // Database stores as string
    expect(savedMember.emergency_contact_name).toEqual('Jane Doe');
    expect(savedMember.emergency_contact_phone).toEqual('+0987654321');
    expect(savedMember.medical_conditions).toEqual('No known allergies');
    expect(savedMember.join_date).toBeDefined(); // Database stores as string
    expect(savedMember.created_at).toBeDefined(); // Database stores as string
  });

  it('should enforce email uniqueness', async () => {
    // Create first member
    await createMember(testInput);

    // Try to create another member with same email
    const duplicateInput: CreateMemberInput = {
      ...testInput,
      first_name: 'Different',
      last_name: 'Person',
    };

    // Should throw error due to email uniqueness constraint
    await expect(createMember(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should handle date fields correctly', async () => {
    const dateInput: CreateMemberInput = {
      first_name: 'Date',
      last_name: 'Test',
      email: 'date.test@example.com',
      phone: null,
      date_of_birth: new Date('1985-12-25'),
      emergency_contact_name: null,
      emergency_contact_phone: null,
      medical_conditions: null,
    };

    const result = await createMember(dateInput);
    
    expect(result.date_of_birth).toBeInstanceOf(Date);
    expect(result.date_of_birth?.toDateString()).toEqual(new Date('1985-12-25').toDateString());
    
    // Verify join_date is set to today
    const today = new Date().toDateString();
    expect(result.join_date.toDateString()).toEqual(today);
  });

  it('should create multiple members successfully', async () => {
    const member1 = await createMember({
      ...testInput,
      email: 'member1@example.com',
    });

    const member2 = await createMember({
      ...minimalInput,
      email: 'member2@example.com',
    });

    // Both should have different IDs
    expect(member1.id).not.toEqual(member2.id);
    expect(member1.email).toEqual('member1@example.com');
    expect(member2.email).toEqual('member2@example.com');

    // Verify both are in database
    const allMembers = await db.select().from(membersTable).execute();
    expect(allMembers).toHaveLength(2);
  });
});