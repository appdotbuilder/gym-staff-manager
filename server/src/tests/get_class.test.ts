import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, trainersTable } from '../db/schema';
import { getClass } from '../handlers/get_class';

// Test data
const testTrainer = {
  first_name: 'John',
  last_name: 'Trainer',
  email: 'john.trainer@gym.com',
  phone: '555-0101',
  specialization: 'Yoga',
  hourly_rate: '50.00'
};

const testClass = {
  name: 'Morning Yoga',
  description: 'Relaxing yoga class',
  max_capacity: 20,
  duration_minutes: 60,
  class_date: '2024-01-15',
  start_time: '09:00:00',
  is_cancelled: false
};

describe('getClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve a class by id', async () => {
    // Create prerequisite trainer
    const trainerResult = await db.insert(trainersTable)
      .values(testTrainer)
      .returning()
      .execute();

    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        ...testClass,
        trainer_id: trainerResult[0].id
      })
      .returning()
      .execute();

    const classId = classResult[0].id;

    // Test the handler
    const result = await getClass(classId);

    // Verify all fields
    expect(result.id).toBe(classId);
    expect(result.name).toBe('Morning Yoga');
    expect(result.description).toBe('Relaxing yoga class');
    expect(result.trainer_id).toBe(trainerResult[0].id);
    expect(result.max_capacity).toBe(20);
    expect(result.duration_minutes).toBe(60);
    expect(result.class_date).toEqual(new Date('2024-01-15'));
    expect(result.start_time).toBe('09:00:00');
    expect(result.is_cancelled).toBe(false);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should handle null description', async () => {
    // Create prerequisite trainer
    const trainerResult = await db.insert(trainersTable)
      .values(testTrainer)
      .returning()
      .execute();

    // Create class with null description
    const classResult = await db.insert(classesTable)
      .values({
        ...testClass,
        description: null,
        trainer_id: trainerResult[0].id
      })
      .returning()
      .execute();

    const result = await getClass(classResult[0].id);

    expect(result.description).toBeNull();
    expect(result.name).toBe('Morning Yoga');
  });

  it('should handle cancelled classes', async () => {
    // Create prerequisite trainer
    const trainerResult = await db.insert(trainersTable)
      .values(testTrainer)
      .returning()
      .execute();

    // Create cancelled class
    const classResult = await db.insert(classesTable)
      .values({
        ...testClass,
        is_cancelled: true,
        trainer_id: trainerResult[0].id
      })
      .returning()
      .execute();

    const result = await getClass(classResult[0].id);

    expect(result.is_cancelled).toBe(true);
    expect(result.name).toBe('Morning Yoga');
  });

  it('should throw error when class not found', async () => {
    const nonExistentId = 99999;

    await expect(getClass(nonExistentId)).rejects.toThrow(/Class with id 99999 not found/i);
  });

  it('should handle different time formats correctly', async () => {
    // Create prerequisite trainer
    const trainerResult = await db.insert(trainersTable)
      .values(testTrainer)
      .returning()
      .execute();

    // Create class with evening time
    const classResult = await db.insert(classesTable)
      .values({
        ...testClass,
        name: 'Evening Workout',
        start_time: '18:30:00',
        trainer_id: trainerResult[0].id
      })
      .returning()
      .execute();

    const result = await getClass(classResult[0].id);

    expect(result.start_time).toBe('18:30:00');
    expect(result.name).toBe('Evening Workout');
  });

  it('should handle edge case values correctly', async () => {
    // Create prerequisite trainer
    const trainerResult = await db.insert(trainersTable)
      .values(testTrainer)
      .returning()
      .execute();

    // Create class with edge case values
    const classResult = await db.insert(classesTable)
      .values({
        name: 'X', // minimum length name
        description: null,
        max_capacity: 1, // minimum capacity
        duration_minutes: 15, // short duration
        class_date: '2024-12-31', // end of year
        start_time: '23:59:00', // late time
        is_cancelled: false,
        trainer_id: trainerResult[0].id
      })
      .returning()
      .execute();

    const result = await getClass(classResult[0].id);

    expect(result.name).toBe('X');
    expect(result.max_capacity).toBe(1);
    expect(result.duration_minutes).toBe(15);
    expect(result.class_date).toEqual(new Date('2024-12-31'));
    expect(result.start_time).toBe('23:59:00');
  });
});