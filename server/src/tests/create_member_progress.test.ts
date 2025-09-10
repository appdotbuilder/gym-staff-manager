import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { memberProgressTable, membersTable } from '../db/schema';
import { type CreateMemberProgressInput } from '../schema';
import { createMemberProgress } from '../handlers/create_member_progress';
import { eq } from 'drizzle-orm';

describe('createMemberProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testMemberId: number;

  beforeEach(async () => {
    // Create a test member first
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-0123',
        date_of_birth: '1990-01-01', // Use string format for date column
        emergency_contact_name: 'Jane Doe',
        emergency_contact_phone: '555-0124',
        medical_conditions: 'None',
      })
      .returning()
      .execute();

    testMemberId = memberResult[0].id;
  });

  it('should create a member progress record with all fields', async () => {
    const testInput: CreateMemberProgressInput = {
      member_id: testMemberId,
      weight: 75.5,
      body_fat_percentage: 15.2,
      muscle_mass: 45.8,
      notes: 'Good progress this week',
      recorded_date: new Date('2024-01-15'),
    };

    const result = await createMemberProgress(testInput);

    // Verify all fields are correctly set
    expect(result.member_id).toEqual(testMemberId);
    expect(result.weight).toEqual(75.5);
    expect(typeof result.weight).toBe('number');
    expect(result.body_fat_percentage).toEqual(15.2);
    expect(typeof result.body_fat_percentage).toBe('number');
    expect(result.muscle_mass).toEqual(45.8);
    expect(typeof result.muscle_mass).toBe('number');
    expect(result.notes).toEqual('Good progress this week');
    expect(result.recorded_date).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a member progress record with null values', async () => {
    const testInput: CreateMemberProgressInput = {
      member_id: testMemberId,
      weight: null,
      body_fat_percentage: null,
      muscle_mass: null,
      notes: null,
    };

    const result = await createMemberProgress(testInput);

    // Verify null values are handled correctly
    expect(result.member_id).toEqual(testMemberId);
    expect(result.weight).toBeNull();
    expect(result.body_fat_percentage).toBeNull();
    expect(result.muscle_mass).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.recorded_date).toBeInstanceOf(Date);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should use current date when recorded_date is not provided', async () => {
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0]; // Get YYYY-MM-DD format
    
    const testInput: CreateMemberProgressInput = {
      member_id: testMemberId,
      weight: 80.0,
      body_fat_percentage: 18.5,
      muscle_mass: 50.2,
      notes: 'Regular check-in',
    };

    const result = await createMemberProgress(testInput);

    // Verify recorded_date is set to today's date (date only, not time)
    expect(result.recorded_date).toBeInstanceOf(Date);
    expect(result.recorded_date.toISOString().split('T')[0]).toEqual(todayDateString);
  });

  it('should save member progress to database correctly', async () => {
    const testInput: CreateMemberProgressInput = {
      member_id: testMemberId,
      weight: 70.2,
      body_fat_percentage: 12.5,
      muscle_mass: 42.8,
      notes: 'Great improvement',
      recorded_date: new Date('2024-02-01'),
    };

    const result = await createMemberProgress(testInput);

    // Query the database to verify the record was saved
    const savedProgress = await db.select()
      .from(memberProgressTable)
      .where(eq(memberProgressTable.id, result.id))
      .execute();

    expect(savedProgress).toHaveLength(1);
    const progress = savedProgress[0];
    
    expect(progress.member_id).toEqual(testMemberId);
    expect(parseFloat(progress.weight!)).toEqual(70.2);
    expect(parseFloat(progress.body_fat_percentage!)).toEqual(12.5);
    expect(parseFloat(progress.muscle_mass!)).toEqual(42.8);
    expect(progress.notes).toEqual('Great improvement');
    expect(progress.recorded_date).toEqual('2024-02-01'); // Database stores as string
    expect(progress.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when member does not exist', async () => {
    const testInput: CreateMemberProgressInput = {
      member_id: 99999, // Non-existent member ID
      weight: 75.0,
      body_fat_percentage: 15.0,
      muscle_mass: 45.0,
      notes: 'Test progress',
    };

    await expect(createMemberProgress(testInput)).rejects.toThrow(/Member with ID 99999 not found/i);
  });

  it('should handle edge case values correctly', async () => {
    const testInput: CreateMemberProgressInput = {
      member_id: testMemberId,
      weight: 0.1, // Very low weight
      body_fat_percentage: 0.01, // Very low body fat
      muscle_mass: 99.99, // High muscle mass
      notes: '',
      recorded_date: new Date('2024-12-31'),
    };

    const result = await createMemberProgress(testInput);

    expect(result.weight).toEqual(0.1);
    expect(result.body_fat_percentage).toEqual(0.01);
    expect(result.muscle_mass).toEqual(99.99);
    expect(result.notes).toEqual('');
    expect(result.recorded_date).toEqual(new Date('2024-12-31'));
  });

  it('should create multiple progress records for the same member', async () => {
    const testInput1: CreateMemberProgressInput = {
      member_id: testMemberId,
      weight: 75.0,
      body_fat_percentage: 15.0,
      muscle_mass: 45.0,
      notes: 'First measurement',
      recorded_date: new Date('2024-01-01'),
    };

    const testInput2: CreateMemberProgressInput = {
      member_id: testMemberId,
      weight: 74.5,
      body_fat_percentage: 14.8,
      muscle_mass: 45.2,
      notes: 'Second measurement',
      recorded_date: new Date('2024-01-15'),
    };

    const result1 = await createMemberProgress(testInput1);
    const result2 = await createMemberProgress(testInput2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.member_id).toEqual(testMemberId);
    expect(result2.member_id).toEqual(testMemberId);
    expect(result1.notes).toEqual('First measurement');
    expect(result2.notes).toEqual('Second measurement');

    // Verify both records exist in database
    const allProgress = await db.select()
      .from(memberProgressTable)
      .where(eq(memberProgressTable.member_id, testMemberId))
      .execute();

    expect(allProgress).toHaveLength(2);
  });
});