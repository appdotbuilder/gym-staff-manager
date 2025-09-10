import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, memberProgressTable } from '../db/schema';
import { type CreateMemberInput, type CreateMemberProgressInput } from '../schema';
import { getMemberProgress } from '../handlers/get_member_progress';
import { eq } from 'drizzle-orm';

// Test data for member and progress records
const testMember: CreateMemberInput = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@test.com',
  phone: '555-1234',
  date_of_birth: new Date('1990-01-15'),
  emergency_contact_name: 'Jane Doe',
  emergency_contact_phone: '555-5678',
  medical_conditions: null,
};

const testProgress1: CreateMemberProgressInput = {
  member_id: 1, // Will be set after creating member
  weight: 75.5,
  body_fat_percentage: 15.2,
  muscle_mass: 45.8,
  notes: 'Good progress this week',
  recorded_date: new Date('2024-01-15'),
};

const testProgress2: CreateMemberProgressInput = {
  member_id: 1, // Will be set after creating member
  weight: 74.2,
  body_fat_percentage: 14.8,
  muscle_mass: 46.1,
  notes: 'Continued improvement',
  recorded_date: new Date('2024-01-22'),
};

const testProgress3: CreateMemberProgressInput = {
  member_id: 1, // Will be set after creating member
  weight: null,
  body_fat_percentage: null,
  muscle_mass: 46.5,
  notes: 'Muscle mass only measurement',
  recorded_date: new Date('2024-01-08'),
};

describe('getMemberProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for member with no progress records', async () => {
    // Create member without progress records
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: testMember.first_name,
        last_name: testMember.last_name,
        email: testMember.email,
        phone: testMember.phone,
        date_of_birth: '1990-01-15',
        emergency_contact_name: testMember.emergency_contact_name,
        emergency_contact_phone: testMember.emergency_contact_phone,
        medical_conditions: testMember.medical_conditions,
      })
      .returning()
      .execute();

    const memberId = memberResult[0].id;
    const result = await getMemberProgress(memberId);

    expect(result).toEqual([]);
  });

  it('should return progress records for a member ordered by recorded_date descending', async () => {
    // Create member first
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: testMember.first_name,
        last_name: testMember.last_name,
        email: testMember.email,
        phone: testMember.phone,
        date_of_birth: '1990-01-15',
        emergency_contact_name: testMember.emergency_contact_name,
        emergency_contact_phone: testMember.emergency_contact_phone,
        medical_conditions: testMember.medical_conditions,
      })
      .returning()
      .execute();

    const memberId = memberResult[0].id;

    // Create multiple progress records with different dates
    await db.insert(memberProgressTable)
      .values([
        {
          member_id: memberId,
          weight: testProgress1.weight?.toString(),
          body_fat_percentage: testProgress1.body_fat_percentage?.toString(),
          muscle_mass: testProgress1.muscle_mass?.toString(),
          notes: testProgress1.notes,
          recorded_date: '2024-01-15',
        },
        {
          member_id: memberId,
          weight: testProgress2.weight?.toString(),
          body_fat_percentage: testProgress2.body_fat_percentage?.toString(),
          muscle_mass: testProgress2.muscle_mass?.toString(),
          notes: testProgress2.notes,
          recorded_date: '2024-01-22',
        },
        {
          member_id: memberId,
          weight: testProgress3.weight?.toString(),
          body_fat_percentage: testProgress3.body_fat_percentage?.toString(),
          muscle_mass: testProgress3.muscle_mass?.toString(),
          notes: testProgress3.notes,
          recorded_date: '2024-01-08',
        },
      ])
      .execute();

    const result = await getMemberProgress(memberId);

    // Should return 3 records
    expect(result).toHaveLength(3);

    // Should be ordered by recorded_date descending (most recent first)
    expect(result[0].recorded_date).toEqual(new Date('2024-01-22'));
    expect(result[1].recorded_date).toEqual(new Date('2024-01-15'));
    expect(result[2].recorded_date).toEqual(new Date('2024-01-08'));

    // Check numeric conversions and field values
    expect(result[0].weight).toEqual(74.2);
    expect(result[0].body_fat_percentage).toEqual(14.8);
    expect(result[0].muscle_mass).toEqual(46.1);
    expect(result[0].notes).toEqual('Continued improvement');

    // Check null handling
    expect(result[2].weight).toBeNull();
    expect(result[2].body_fat_percentage).toBeNull();
    expect(result[2].muscle_mass).toEqual(46.5);
    expect(result[2].notes).toEqual('Muscle mass only measurement');
  });

  it('should return numeric types for converted fields', async () => {
    // Create member and progress record
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: testMember.first_name,
        last_name: testMember.last_name,
        email: testMember.email,
        phone: testMember.phone,
        date_of_birth: '1990-01-15',
        emergency_contact_name: testMember.emergency_contact_name,
        emergency_contact_phone: testMember.emergency_contact_phone,
        medical_conditions: testMember.medical_conditions,
      })
      .returning()
      .execute();

    const memberId = memberResult[0].id;

    await db.insert(memberProgressTable)
      .values({
        member_id: memberId,
        weight: testProgress1.weight?.toString(),
        body_fat_percentage: testProgress1.body_fat_percentage?.toString(),
        muscle_mass: testProgress1.muscle_mass?.toString(),
        notes: testProgress1.notes,
        recorded_date: '2024-01-15',
      })
      .execute();

    const result = await getMemberProgress(memberId);

    expect(result).toHaveLength(1);

    // Verify numeric types
    expect(typeof result[0].weight).toBe('number');
    expect(typeof result[0].body_fat_percentage).toBe('number');
    expect(typeof result[0].muscle_mass).toBe('number');
    expect(typeof result[0].member_id).toBe('number');
    expect(typeof result[0].id).toBe('number');

    // Verify date types
    expect(result[0].recorded_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should only return progress records for the specified member', async () => {
    // Create two different members
    const member1Result = await db.insert(membersTable)
      .values({
        first_name: testMember.first_name,
        last_name: testMember.last_name,
        email: testMember.email,
        phone: testMember.phone,
        date_of_birth: '1990-01-15',
        emergency_contact_name: testMember.emergency_contact_name,
        emergency_contact_phone: testMember.emergency_contact_phone,
        medical_conditions: testMember.medical_conditions,
      })
      .returning()
      .execute();

    const member2Result = await db.insert(membersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane.doe@test.com',
        phone: '555-1234',
        date_of_birth: '1990-01-15',
        emergency_contact_name: 'Jane Doe',
        emergency_contact_phone: '555-5678',
        medical_conditions: null,
      })
      .returning()
      .execute();

    const member1Id = member1Result[0].id;
    const member2Id = member2Result[0].id;

    // Create progress records for both members
    await db.insert(memberProgressTable)
      .values([
        {
          member_id: member1Id,
          weight: testProgress1.weight?.toString(),
          body_fat_percentage: testProgress1.body_fat_percentage?.toString(),
          muscle_mass: testProgress1.muscle_mass?.toString(),
          notes: testProgress1.notes,
          recorded_date: '2024-01-15',
        },
        {
          member_id: member2Id,
          weight: testProgress2.weight?.toString(),
          body_fat_percentage: testProgress2.body_fat_percentage?.toString(),
          muscle_mass: testProgress2.muscle_mass?.toString(),
          notes: testProgress2.notes,
          recorded_date: '2024-01-22',
        },
      ])
      .execute();

    // Get progress for member 1
    const result1 = await getMemberProgress(member1Id);
    expect(result1).toHaveLength(1);
    expect(result1[0].member_id).toEqual(member1Id);
    expect(result1[0].weight).toEqual(75.5);

    // Get progress for member 2
    const result2 = await getMemberProgress(member2Id);
    expect(result2).toHaveLength(1);
    expect(result2[0].member_id).toEqual(member2Id);
    expect(result2[0].weight).toEqual(74.2);
  });

  it('should verify progress records exist in database', async () => {
    // Create member and progress record
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: testMember.first_name,
        last_name: testMember.last_name,
        email: testMember.email,
        phone: testMember.phone,
        date_of_birth: '1990-01-15',
        emergency_contact_name: testMember.emergency_contact_name,
        emergency_contact_phone: testMember.emergency_contact_phone,
        medical_conditions: testMember.medical_conditions,
      })
      .returning()
      .execute();

    const memberId = memberResult[0].id;

    await db.insert(memberProgressTable)
      .values({
        member_id: memberId,
        weight: testProgress1.weight?.toString(),
        body_fat_percentage: testProgress1.body_fat_percentage?.toString(),
        muscle_mass: testProgress1.muscle_mass?.toString(),
        notes: testProgress1.notes,
        recorded_date: '2024-01-15',
      })
      .execute();

    const result = await getMemberProgress(memberId);

    // Verify data was actually saved to database by querying directly
    const dbRecords = await db.select()
      .from(memberProgressTable)
      .where(eq(memberProgressTable.member_id, memberId))
      .execute();

    expect(dbRecords).toHaveLength(1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(dbRecords[0].id);
    expect(result[0].member_id).toEqual(dbRecords[0].member_id);
  });

  it('should handle member with mixed null and non-null values', async () => {
    // Create member
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: testMember.first_name,
        last_name: testMember.last_name,
        email: testMember.email,
        phone: testMember.phone,
        date_of_birth: '1990-01-15',
        emergency_contact_name: testMember.emergency_contact_name,
        emergency_contact_phone: testMember.emergency_contact_phone,
        medical_conditions: testMember.medical_conditions,
      })
      .returning()
      .execute();

    const memberId = memberResult[0].id;

    // Create progress records with various null combinations
    await db.insert(memberProgressTable)
      .values([
        {
          member_id: memberId,
          weight: '80.5',
          body_fat_percentage: null,
          muscle_mass: '50.0',
          notes: 'Weight and muscle only',
          recorded_date: '2024-01-10',
        },
        {
          member_id: memberId,
          weight: null,
          body_fat_percentage: '16.5',
          muscle_mass: null,
          notes: 'Body fat only',
          recorded_date: '2024-01-05',
        },
      ])
      .execute();

    const result = await getMemberProgress(memberId);

    expect(result).toHaveLength(2);

    // First record (more recent)
    expect(result[0].weight).toEqual(80.5);
    expect(result[0].body_fat_percentage).toBeNull();
    expect(result[0].muscle_mass).toEqual(50.0);

    // Second record (older)
    expect(result[1].weight).toBeNull();
    expect(result[1].body_fat_percentage).toEqual(16.5);
    expect(result[1].muscle_mass).toBeNull();
  });
});