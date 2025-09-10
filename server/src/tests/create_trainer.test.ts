import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { trainersTable } from '../db/schema';
import { type CreateTrainerInput } from '../schema';
import { createTrainer } from '../handlers/create_trainer';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInputFull: CreateTrainerInput = {
  first_name: 'John',
  last_name: 'Smith',
  email: 'john.smith@gym.com',
  phone: '+1-555-0123',
  specialization: 'Weight Training',
  hourly_rate: 75.50
};

// Test input with minimal required fields
const testInputMinimal: CreateTrainerInput = {
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane.doe@gym.com',
  phone: null,
  specialization: null,
  hourly_rate: null
};

describe('createTrainer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a trainer with all fields', async () => {
    const result = await createTrainer(testInputFull);

    // Basic field validation
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toEqual('john.smith@gym.com');
    expect(result.phone).toEqual('+1-555-0123');
    expect(result.specialization).toEqual('Weight Training');
    expect(result.hourly_rate).toEqual(75.50);
    expect(typeof result.hourly_rate).toEqual('number');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.hire_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a trainer with minimal fields', async () => {
    const result = await createTrainer(testInputMinimal);

    // Basic field validation
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Doe');
    expect(result.email).toEqual('jane.doe@gym.com');
    expect(result.phone).toBeNull();
    expect(result.specialization).toBeNull();
    expect(result.hourly_rate).toBeNull();
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.hire_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save trainer to database', async () => {
    const result = await createTrainer(testInputFull);

    // Query using proper drizzle syntax
    const trainers = await db.select()
      .from(trainersTable)
      .where(eq(trainersTable.id, result.id))
      .execute();

    expect(trainers).toHaveLength(1);
    expect(trainers[0].first_name).toEqual('John');
    expect(trainers[0].last_name).toEqual('Smith');
    expect(trainers[0].email).toEqual('john.smith@gym.com');
    expect(trainers[0].phone).toEqual('+1-555-0123');
    expect(trainers[0].specialization).toEqual('Weight Training');
    expect(parseFloat(trainers[0].hourly_rate!)).toEqual(75.50);
    expect(trainers[0].is_active).toEqual(true);
    expect(typeof trainers[0].hire_date).toEqual('string'); // Database returns date columns as strings
    expect(trainers[0].created_at).toBeInstanceOf(Date); // Database returns timestamp columns as Date objects
  });

  it('should handle numeric hourly_rate correctly', async () => {
    const testInput: CreateTrainerInput = {
      first_name: 'Mike',
      last_name: 'Johnson',
      email: 'mike.johnson@gym.com',
      phone: null,
      specialization: null,
      hourly_rate: 99.99
    };

    const result = await createTrainer(testInput);

    // Verify numeric conversion in returned data
    expect(result.hourly_rate).toEqual(99.99);
    expect(typeof result.hourly_rate).toEqual('number');

    // Verify data saved correctly in database
    const trainers = await db.select()
      .from(trainersTable)
      .where(eq(trainersTable.id, result.id))
      .execute();

    expect(parseFloat(trainers[0].hourly_rate!)).toEqual(99.99);
  });

  it('should enforce email uniqueness', async () => {
    // Create first trainer
    await createTrainer(testInputFull);

    // Try to create second trainer with same email
    const duplicateInput: CreateTrainerInput = {
      first_name: 'Another',
      last_name: 'Trainer',
      email: 'john.smith@gym.com', // Same email as first trainer
      phone: null,
      specialization: null,
      hourly_rate: null
    };

    await expect(createTrainer(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint|unique constraint/i);
  });

  it('should set default values correctly', async () => {
    const result = await createTrainer(testInputMinimal);

    // Verify defaults are applied
    expect(result.is_active).toEqual(true);
    expect(result.hire_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify hire_date is set to today
    const today = new Date();
    const hireDate = result.hire_date;
    expect(hireDate.getFullYear()).toEqual(today.getFullYear());
    expect(hireDate.getMonth()).toEqual(today.getMonth());
    expect(hireDate.getDate()).toEqual(today.getDate());
  });
});