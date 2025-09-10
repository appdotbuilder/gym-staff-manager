import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, trainersTable } from '../db/schema';
import { type UpdateClassInput } from '../schema';
import { updateClass } from '../handlers/update_class';
import { eq } from 'drizzle-orm';

describe('updateClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let trainerId: number;
  let classId: number;

  beforeEach(async () => {
    // Create a trainer first
    const trainerResult = await db.insert(trainersTable)
      .values({
        first_name: 'Test',
        last_name: 'Trainer',
        email: 'trainer@test.com',
        phone: '+1234567890',
        specialization: 'Yoga',
        hourly_rate: '50.00',
        hire_date: '2024-01-01',
        is_active: true
      })
      .returning()
      .execute();
    trainerId = trainerResult[0].id;

    // Create a class to update
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Original Yoga Class',
        description: 'Original description',
        trainer_id: trainerId,
        max_capacity: 15,
        duration_minutes: 60,
        class_date: '2024-12-25',
        start_time: '10:00',
        is_cancelled: false
      })
      .returning()
      .execute();
    classId = classResult[0].id;
  });

  it('should update all class fields', async () => {
    // Create a second trainer for testing trainer updates
    const newTrainerResult = await db.insert(trainersTable)
      .values({
        first_name: 'New',
        last_name: 'Trainer',
        email: 'newtrainer@test.com',
        phone: '+1234567891',
        specialization: 'Pilates',
        hourly_rate: '60.00',
        hire_date: '2024-01-01',
        is_active: true
      })
      .returning()
      .execute();
    const newTrainerId = newTrainerResult[0].id;

    const updateInput: UpdateClassInput = {
      id: classId,
      name: 'Updated Pilates Class',
      description: 'Updated description for Pilates',
      trainer_id: newTrainerId,
      max_capacity: 25,
      duration_minutes: 90,
      class_date: new Date('2024-12-26'),
      start_time: '14:30',
      is_cancelled: true
    };

    const result = await updateClass(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(classId);
    expect(result.name).toEqual('Updated Pilates Class');
    expect(result.description).toEqual('Updated description for Pilates');
    expect(result.trainer_id).toEqual(newTrainerId);
    expect(result.max_capacity).toEqual(25);
    expect(result.duration_minutes).toEqual(90);
    expect(result.class_date).toEqual(new Date('2024-12-26'));
    expect(result.start_time).toEqual('14:30:00');
    expect(result.is_cancelled).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const updateInput: UpdateClassInput = {
      id: classId,
      name: 'Updated Name Only',
      max_capacity: 30
    };

    const result = await updateClass(updateInput);

    // Verify updated fields
    expect(result.name).toEqual('Updated Name Only');
    expect(result.max_capacity).toEqual(30);

    // Verify unchanged fields remain the same
    expect(result.description).toEqual('Original description');
    expect(result.trainer_id).toEqual(trainerId);
    expect(result.duration_minutes).toEqual(60);
    expect(result.class_date).toEqual(new Date('2024-12-25'));
    expect(result.start_time).toEqual('10:00:00');
    expect(result.is_cancelled).toEqual(false);
  });

  it('should update class to cancelled status', async () => {
    const updateInput: UpdateClassInput = {
      id: classId,
      is_cancelled: true
    };

    const result = await updateClass(updateInput);

    expect(result.is_cancelled).toEqual(true);
    // Verify other fields remain unchanged
    expect(result.name).toEqual('Original Yoga Class');
    expect(result.max_capacity).toEqual(15);
  });

  it('should update class time and date', async () => {
    const newDate = new Date('2025-01-15');
    const updateInput: UpdateClassInput = {
      id: classId,
      class_date: newDate,
      start_time: '18:00',
      duration_minutes: 45
    };

    const result = await updateClass(updateInput);

    expect(result.class_date).toEqual(newDate);
    expect(result.start_time).toEqual('18:00:00');
    expect(result.duration_minutes).toEqual(45);
  });

  it('should update nullable description field', async () => {
    const updateInput: UpdateClassInput = {
      id: classId,
      description: null
    };

    const result = await updateClass(updateInput);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Original Yoga Class'); // Other fields unchanged
  });

  it('should persist changes to database', async () => {
    const updateInput: UpdateClassInput = {
      id: classId,
      name: 'Database Persistence Test',
      max_capacity: 50
    };

    await updateClass(updateInput);

    // Verify changes persisted in database
    const classFromDb = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    expect(classFromDb).toHaveLength(1);
    expect(classFromDb[0].name).toEqual('Database Persistence Test');
    expect(classFromDb[0].max_capacity).toEqual(50);
  });

  it('should throw error for non-existent class', async () => {
    const updateInput: UpdateClassInput = {
      id: 99999,
      name: 'Non-existent Class'
    };

    await expect(updateClass(updateInput)).rejects.toThrow(/Class with id 99999 not found/i);
  });

  it('should handle foreign key constraint violation for invalid trainer', async () => {
    const updateInput: UpdateClassInput = {
      id: classId,
      trainer_id: 99999 // Non-existent trainer
    };

    await expect(updateClass(updateInput)).rejects.toThrow();
  });

  it('should update with valid time format validation', async () => {
    const updateInput: UpdateClassInput = {
      id: classId,
      start_time: '23:59'
    };

    const result = await updateClass(updateInput);

    expect(result.start_time).toEqual('23:59:00');
  });
});