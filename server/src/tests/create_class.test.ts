import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, trainersTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { createClass } from '../handlers/create_class';
import { eq } from 'drizzle-orm';

// Test data
const testTrainer = {
  first_name: 'John',
  last_name: 'Smith',
  email: 'john.smith@gym.com',
  phone: '+1234567890',
  specialization: 'Strength Training',
  hourly_rate: '50.00',
};

const testClassInput: CreateClassInput = {
  name: 'Morning Yoga',
  description: 'Relaxing yoga session to start your day',
  trainer_id: 1, // Will be set dynamically in tests
  max_capacity: 20,
  duration_minutes: 60,
  class_date: new Date('2024-03-15'),
  start_time: '08:00',
};

describe('createClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a class successfully', async () => {
    // Create a trainer first
    const trainerResult = await db.insert(trainersTable)
      .values(testTrainer)
      .returning()
      .execute();
    
    const trainerId = trainerResult[0].id;
    
    const input = {
      ...testClassInput,
      trainer_id: trainerId,
    };

    const result = await createClass(input);

    // Verify basic field values
    expect(result.name).toEqual('Morning Yoga');
    expect(result.description).toEqual('Relaxing yoga session to start your day');
    expect(result.trainer_id).toEqual(trainerId);
    expect(result.max_capacity).toEqual(20);
    expect(result.duration_minutes).toEqual(60);
    expect(result.start_time).toEqual('08:00:00');
    expect(result.is_cancelled).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.class_date).toBeInstanceOf(Date);
  });

  it('should save class to database', async () => {
    // Create a trainer first
    const trainerResult = await db.insert(trainersTable)
      .values(testTrainer)
      .returning()
      .execute();
    
    const trainerId = trainerResult[0].id;
    
    const input = {
      ...testClassInput,
      trainer_id: trainerId,
    };

    const result = await createClass(input);

    // Query the database to verify the class was saved
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(classes).toHaveLength(1);
    expect(classes[0].name).toEqual('Morning Yoga');
    expect(classes[0].description).toEqual('Relaxing yoga session to start your day');
    expect(classes[0].trainer_id).toEqual(trainerId);
    expect(classes[0].max_capacity).toEqual(20);
    expect(classes[0].duration_minutes).toEqual(60);
    expect(classes[0].start_time).toEqual('08:00:00');
    expect(classes[0].is_cancelled).toEqual(false);
    expect(classes[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null description', async () => {
    // Create a trainer first
    const trainerResult = await db.insert(trainersTable)
      .values(testTrainer)
      .returning()
      .execute();
    
    const trainerId = trainerResult[0].id;
    
    const input = {
      ...testClassInput,
      trainer_id: trainerId,
      description: null,
    };

    const result = await createClass(input);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Morning Yoga');
    expect(result.trainer_id).toEqual(trainerId);
  });

  it('should throw error when trainer does not exist', async () => {
    const input = {
      ...testClassInput,
      trainer_id: 999, // Non-existent trainer ID
    };

    await expect(createClass(input)).rejects.toThrow(/Trainer with id 999 not found/);
  });

  it('should create multiple classes for same trainer', async () => {
    // Create a trainer first
    const trainerResult = await db.insert(trainersTable)
      .values(testTrainer)
      .returning()
      .execute();
    
    const trainerId = trainerResult[0].id;

    const input1 = {
      ...testClassInput,
      trainer_id: trainerId,
      name: 'Morning Yoga',
      start_time: '08:00',
    };

    const input2 = {
      ...testClassInput,
      trainer_id: trainerId,
      name: 'Evening Pilates',
      start_time: '18:00',
    };

    const result1 = await createClass(input1);
    const result2 = await createClass(input2);

    expect(result1.name).toEqual('Morning Yoga');
    expect(result1.trainer_id).toEqual(trainerId);
    expect(result2.name).toEqual('Evening Pilates');
    expect(result2.trainer_id).toEqual(trainerId);
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should handle different time formats correctly', async () => {
    // Create a trainer first
    const trainerResult = await db.insert(trainersTable)
      .values(testTrainer)
      .returning()
      .execute();
    
    const trainerId = trainerResult[0].id;
    
    const input = {
      ...testClassInput,
      trainer_id: trainerId,
      start_time: '14:30', // Afternoon time
    };

    const result = await createClass(input);

    expect(result.start_time).toEqual('14:30:00');
    
    // Verify it's saved correctly in the database
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(classes[0].start_time).toEqual('14:30:00');
  });

  it('should create class with large capacity', async () => {
    // Create a trainer first
    const trainerResult = await db.insert(trainersTable)
      .values(testTrainer)
      .returning()
      .execute();
    
    const trainerId = trainerResult[0].id;
    
    const input = {
      ...testClassInput,
      trainer_id: trainerId,
      max_capacity: 100,
      duration_minutes: 90,
    };

    const result = await createClass(input);

    expect(result.max_capacity).toEqual(100);
    expect(result.duration_minutes).toEqual(90);
  });
});