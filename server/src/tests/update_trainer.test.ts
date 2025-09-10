import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { trainersTable } from '../db/schema';
import { type UpdateTrainerInput, type CreateTrainerInput } from '../schema';
import { updateTrainer } from '../handlers/update_trainer';
import { eq } from 'drizzle-orm';

// Helper function to create a test trainer
const createTestTrainer = async (overrides: Partial<CreateTrainerInput> = {}) => {
  const trainerData = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-0123',
    specialization: 'Strength Training',
    hourly_rate: 75.00,
    ...overrides
  };

  const result = await db.insert(trainersTable)
    .values({
      ...trainerData,
      hourly_rate: trainerData.hourly_rate ? trainerData.hourly_rate.toString() : null
    })
    .returning()
    .execute();

  return {
    ...result[0],
    hourly_rate: result[0].hourly_rate ? parseFloat(result[0].hourly_rate) : null
  };
};

describe('updateTrainer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update trainer first and last name', async () => {
    const trainer = await createTestTrainer();
    
    const updateInput: UpdateTrainerInput = {
      id: trainer.id,
      first_name: 'Jane',
      last_name: 'Smith'
    };

    const result = await updateTrainer(updateInput);

    expect(result.id).toEqual(trainer.id);
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toEqual(trainer.email); // Should remain unchanged
    expect(result.specialization).toEqual(trainer.specialization); // Should remain unchanged
    expect(result.hourly_rate).toEqual(trainer.hourly_rate); // Should remain unchanged
  });

  it('should update trainer email and phone', async () => {
    const trainer = await createTestTrainer();
    
    const updateInput: UpdateTrainerInput = {
      id: trainer.id,
      email: 'new.email@example.com',
      phone: '555-9999'
    };

    const result = await updateTrainer(updateInput);

    expect(result.id).toEqual(trainer.id);
    expect(result.email).toEqual('new.email@example.com');
    expect(result.phone).toEqual('555-9999');
    expect(result.first_name).toEqual(trainer.first_name); // Should remain unchanged
    expect(result.last_name).toEqual(trainer.last_name); // Should remain unchanged
  });

  it('should update trainer specialization and hourly rate', async () => {
    const trainer = await createTestTrainer();
    
    const updateInput: UpdateTrainerInput = {
      id: trainer.id,
      specialization: 'Cardio Training',
      hourly_rate: 85.50
    };

    const result = await updateTrainer(updateInput);

    expect(result.id).toEqual(trainer.id);
    expect(result.specialization).toEqual('Cardio Training');
    expect(result.hourly_rate).toEqual(85.50);
    expect(typeof result.hourly_rate).toBe('number');
    expect(result.first_name).toEqual(trainer.first_name); // Should remain unchanged
  });

  it('should update trainer active status', async () => {
    const trainer = await createTestTrainer();
    
    const updateInput: UpdateTrainerInput = {
      id: trainer.id,
      is_active: false
    };

    const result = await updateTrainer(updateInput);

    expect(result.id).toEqual(trainer.id);
    expect(result.is_active).toBe(false);
    expect(result.first_name).toEqual(trainer.first_name); // Should remain unchanged
  });

  it('should handle nullable fields correctly', async () => {
    const trainer = await createTestTrainer();
    
    const updateInput: UpdateTrainerInput = {
      id: trainer.id,
      phone: null,
      specialization: null,
      hourly_rate: null
    };

    const result = await updateTrainer(updateInput);

    expect(result.id).toEqual(trainer.id);
    expect(result.phone).toBeNull();
    expect(result.specialization).toBeNull();
    expect(result.hourly_rate).toBeNull();
    expect(result.first_name).toEqual(trainer.first_name); // Should remain unchanged
  });

  it('should save updates to database', async () => {
    const trainer = await createTestTrainer();
    
    const updateInput: UpdateTrainerInput = {
      id: trainer.id,
      first_name: 'Updated',
      specialization: 'Personal Training',
      hourly_rate: 90.00
    };

    await updateTrainer(updateInput);

    // Verify changes were saved to database
    const savedTrainer = await db.select()
      .from(trainersTable)
      .where(eq(trainersTable.id, trainer.id))
      .execute();

    expect(savedTrainer).toHaveLength(1);
    expect(savedTrainer[0].first_name).toEqual('Updated');
    expect(savedTrainer[0].specialization).toEqual('Personal Training');
    expect(parseFloat(savedTrainer[0].hourly_rate!)).toEqual(90.00);
  });

  it('should update all fields at once', async () => {
    const trainer = await createTestTrainer();
    
    const updateInput: UpdateTrainerInput = {
      id: trainer.id,
      first_name: 'Complete',
      last_name: 'Update',
      email: 'complete.update@example.com',
      phone: '555-1111',
      specialization: 'CrossFit',
      hourly_rate: 100.00,
      is_active: false
    };

    const result = await updateTrainer(updateInput);

    expect(result.id).toEqual(trainer.id);
    expect(result.first_name).toEqual('Complete');
    expect(result.last_name).toEqual('Update');
    expect(result.email).toEqual('complete.update@example.com');
    expect(result.phone).toEqual('555-1111');
    expect(result.specialization).toEqual('CrossFit');
    expect(result.hourly_rate).toEqual(100.00);
    expect(result.is_active).toBe(false);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.hire_date).toBeInstanceOf(Date);
  });

  it('should throw error when trainer does not exist', async () => {
    const updateInput: UpdateTrainerInput = {
      id: 99999,
      first_name: 'Nonexistent'
    };

    await expect(updateTrainer(updateInput)).rejects.toThrow(/Trainer with ID 99999 not found/i);
  });

  it('should handle empty update gracefully', async () => {
    const trainer = await createTestTrainer();
    
    const updateInput: UpdateTrainerInput = {
      id: trainer.id
    };

    const result = await updateTrainer(updateInput);

    // Should return original trainer data unchanged
    expect(result.id).toEqual(trainer.id);
    expect(result.first_name).toEqual(trainer.first_name);
    expect(result.last_name).toEqual(trainer.last_name);
    expect(result.email).toEqual(trainer.email);
    expect(result.hourly_rate).toEqual(trainer.hourly_rate);
  });
});