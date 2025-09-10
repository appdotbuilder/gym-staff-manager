import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classAttendanceTable, membersTable, trainersTable, classesTable } from '../db/schema';
import { type UpdateClassAttendanceInput } from '../schema';
import { updateClassAttendance } from '../handlers/update_class_attendance';
import { eq } from 'drizzle-orm';

describe('updateClassAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update class attendance record', async () => {
    // Create prerequisite data
    const [member] = await db.insert(membersTable).values({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@email.com',
      join_date: '2024-01-01',
    }).returning().execute();

    const [trainer] = await db.insert(trainersTable).values({
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@email.com',
      hire_date: '2024-01-01',
    }).returning().execute();

    const [fitnessClass] = await db.insert(classesTable).values({
      name: 'Yoga Class',
      trainer_id: trainer.id,
      max_capacity: 20,
      duration_minutes: 60,
      class_date: '2024-01-15',
      start_time: '09:00',
    }).returning().execute();

    // Create initial attendance record
    const [attendance] = await db.insert(classAttendanceTable).values({
      class_id: fitnessClass.id,
      member_id: member.id,
      attended: false,
      check_in_time: null,
    }).returning().execute();

    const updateInput: UpdateClassAttendanceInput = {
      id: attendance.id,
      attended: true,
      check_in_time: new Date('2024-01-15T09:05:00Z'),
    };

    const result = await updateClassAttendance(updateInput);

    // Verify the update result
    expect(result.id).toEqual(attendance.id);
    expect(result.class_id).toEqual(fitnessClass.id);
    expect(result.member_id).toEqual(member.id);
    expect(result.attended).toEqual(true);
    expect(result.check_in_time).toBeInstanceOf(Date);
    expect(result.check_in_time?.toISOString()).toEqual('2024-01-15T09:05:00.000Z');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update attendance to false and clear check_in_time', async () => {
    // Create prerequisite data
    const [member] = await db.insert(membersTable).values({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@email.com',
      join_date: '2024-01-01',
    }).returning().execute();

    const [trainer] = await db.insert(trainersTable).values({
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@email.com',
      hire_date: '2024-01-01',
    }).returning().execute();

    const [fitnessClass] = await db.insert(classesTable).values({
      name: 'Yoga Class',
      trainer_id: trainer.id,
      max_capacity: 20,
      duration_minutes: 60,
      class_date: '2024-01-15',
      start_time: '09:00',
    }).returning().execute();

    // Create initial attendance record with check-in time
    const [attendance] = await db.insert(classAttendanceTable).values({
      class_id: fitnessClass.id,
      member_id: member.id,
      attended: true,
      check_in_time: new Date('2024-01-15T09:05:00Z'),
    }).returning().execute();

    const updateInput: UpdateClassAttendanceInput = {
      id: attendance.id,
      attended: false,
      check_in_time: null,
    };

    const result = await updateClassAttendance(updateInput);

    // Verify the update result
    expect(result.attended).toEqual(false);
    expect(result.check_in_time).toBeNull();
  });

  it('should save updated attendance to database', async () => {
    // Create prerequisite data
    const [member] = await db.insert(membersTable).values({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@email.com',
      join_date: '2024-01-01',
    }).returning().execute();

    const [trainer] = await db.insert(trainersTable).values({
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@email.com',
      hire_date: '2024-01-01',
    }).returning().execute();

    const [fitnessClass] = await db.insert(classesTable).values({
      name: 'Yoga Class',
      trainer_id: trainer.id,
      max_capacity: 20,
      duration_minutes: 60,
      class_date: '2024-01-15',
      start_time: '09:00',
    }).returning().execute();

    // Create initial attendance record
    const [attendance] = await db.insert(classAttendanceTable).values({
      class_id: fitnessClass.id,
      member_id: member.id,
      attended: false,
      check_in_time: null,
    }).returning().execute();

    const updateInput: UpdateClassAttendanceInput = {
      id: attendance.id,
      attended: true,
      check_in_time: new Date('2024-01-15T09:05:00Z'),
    };

    await updateClassAttendance(updateInput);

    // Verify the record was updated in the database
    const updatedRecords = await db.select()
      .from(classAttendanceTable)
      .where(eq(classAttendanceTable.id, attendance.id))
      .execute();

    expect(updatedRecords).toHaveLength(1);
    expect(updatedRecords[0].attended).toEqual(true);
    expect(updatedRecords[0].check_in_time).toBeInstanceOf(Date);
    expect(updatedRecords[0].check_in_time?.toISOString()).toEqual('2024-01-15T09:05:00.000Z');
  });

  it('should throw error when attendance record not found', async () => {
    const updateInput: UpdateClassAttendanceInput = {
      id: 999, // Non-existent ID
      attended: true,
      check_in_time: new Date(),
    };

    await expect(updateClassAttendance(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Create prerequisite data
    const [member] = await db.insert(membersTable).values({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@email.com',
      join_date: '2024-01-01',
    }).returning().execute();

    const [trainer] = await db.insert(trainersTable).values({
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@email.com',
      hire_date: '2024-01-01',
    }).returning().execute();

    const [fitnessClass] = await db.insert(classesTable).values({
      name: 'Yoga Class',
      trainer_id: trainer.id,
      max_capacity: 20,
      duration_minutes: 60,
      class_date: '2024-01-15',
      start_time: '09:00',
    }).returning().execute();

    // Create initial attendance record
    const [attendance] = await db.insert(classAttendanceTable).values({
      class_id: fitnessClass.id,
      member_id: member.id,
      attended: false,
      check_in_time: null,
    }).returning().execute();

    // Update only attended status, keeping check_in_time as null
    const updateInput: UpdateClassAttendanceInput = {
      id: attendance.id,
      attended: true,
      check_in_time: null,
    };

    const result = await updateClassAttendance(updateInput);

    expect(result.attended).toEqual(true);
    expect(result.check_in_time).toBeNull();
  });
});