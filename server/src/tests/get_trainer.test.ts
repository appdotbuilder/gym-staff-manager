import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { trainersTable } from '../db/schema';
import { type CreateTrainerInput } from '../schema';
import { getTrainer } from '../handlers/get_trainer';

const testTrainer: CreateTrainerInput = {
  first_name: 'John',
  last_name: 'Smith',
  email: 'john.smith@gym.com',
  phone: '+1234567890',
  specialization: 'Personal Training',
  hourly_rate: 75.50,
};

const testTrainerWithNulls: CreateTrainerInput = {
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane.doe@gym.com',
  phone: null,
  specialization: null,
  hourly_rate: null,
};

describe('getTrainer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a trainer by ID with all fields populated', async () => {
    // Create a trainer first
    const insertResult = await db.insert(trainersTable)
      .values({
        first_name: testTrainer.first_name,
        last_name: testTrainer.last_name,
        email: testTrainer.email,
        phone: testTrainer.phone,
        specialization: testTrainer.specialization,
        hourly_rate: testTrainer.hourly_rate?.toString(),
      })
      .returning()
      .execute();

    const trainerId = insertResult[0].id;

    // Get the trainer
    const result = await getTrainer(trainerId);

    expect(result.id).toEqual(trainerId);
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toEqual('john.smith@gym.com');
    expect(result.phone).toEqual('+1234567890');
    expect(result.specialization).toEqual('Personal Training');
    expect(result.hourly_rate).toEqual(75.50);
    expect(typeof result.hourly_rate).toBe('number');
    expect(result.is_active).toBe(true);
    expect(result.hire_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should get a trainer with null optional fields', async () => {
    // Create a trainer with null values
    const insertResult = await db.insert(trainersTable)
      .values({
        first_name: testTrainerWithNulls.first_name,
        last_name: testTrainerWithNulls.last_name,
        email: testTrainerWithNulls.email,
        phone: testTrainerWithNulls.phone,
        specialization: testTrainerWithNulls.specialization,
        hourly_rate: testTrainerWithNulls.hourly_rate?.toString(),
      })
      .returning()
      .execute();

    const trainerId = insertResult[0].id;

    // Get the trainer
    const result = await getTrainer(trainerId);

    expect(result.id).toEqual(trainerId);
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Doe');
    expect(result.email).toEqual('jane.doe@gym.com');
    expect(result.phone).toBeNull();
    expect(result.specialization).toBeNull();
    expect(result.hourly_rate).toBeNull();
    expect(result.is_active).toBe(true);
    expect(result.hire_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should get inactive trainer correctly', async () => {
    // Create an inactive trainer
    const insertResult = await db.insert(trainersTable)
      .values({
        first_name: 'Inactive',
        last_name: 'Trainer',
        email: 'inactive@gym.com',
        phone: null,
        specialization: null,
        hourly_rate: null,
        is_active: false,
      })
      .returning()
      .execute();

    const trainerId = insertResult[0].id;

    // Get the trainer
    const result = await getTrainer(trainerId);

    expect(result.id).toEqual(trainerId);
    expect(result.first_name).toEqual('Inactive');
    expect(result.last_name).toEqual('Trainer');
    expect(result.is_active).toBe(false);
  });

  it('should throw error when trainer does not exist', async () => {
    const nonExistentId = 99999;
    
    await expect(getTrainer(nonExistentId)).rejects.toThrow(/trainer with id 99999 not found/i);
  });

  it('should handle numeric conversion correctly', async () => {
    // Create trainer with decimal hourly rate
    const insertResult = await db.insert(trainersTable)
      .values({
        first_name: 'Test',
        last_name: 'Trainer',
        email: 'test@gym.com',
        phone: null,
        specialization: null,
        hourly_rate: '123.45', // Insert as string
      })
      .returning()
      .execute();

    const trainerId = insertResult[0].id;

    // Get the trainer
    const result = await getTrainer(trainerId);

    expect(result.hourly_rate).toEqual(123.45);
    expect(typeof result.hourly_rate).toBe('number');
  });

  it('should get trainer with specialization correctly', async () => {
    // Create trainer with specific specialization
    const insertResult = await db.insert(trainersTable)
      .values({
        first_name: 'Specialized',
        last_name: 'Trainer',
        email: 'specialized@gym.com',
        phone: '555-0123',
        specialization: 'Weight Training & Nutrition',
        hourly_rate: '85.00',
      })
      .returning()
      .execute();

    const trainerId = insertResult[0].id;

    // Get the trainer
    const result = await getTrainer(trainerId);

    expect(result.specialization).toEqual('Weight Training & Nutrition');
    expect(result.phone).toEqual('555-0123');
    expect(result.hourly_rate).toEqual(85.00);
  });
});