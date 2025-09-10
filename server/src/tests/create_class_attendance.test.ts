import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classAttendanceTable, classesTable, membersTable, trainersTable } from '../db/schema';
import { type CreateClassAttendanceInput } from '../schema';
import { createClassAttendance } from '../handlers/create_class_attendance';
import { eq, and } from 'drizzle-orm';

describe('createClassAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let memberId: number;
  let classId: number;
  let trainerId: number;

  beforeEach(async () => {
    // Create prerequisite trainer
    const trainerResult = await db.insert(trainersTable)
      .values({
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@gym.com',
        phone: '555-0123',
        specialization: 'Personal Training',
        hourly_rate: '75.00'
      })
      .returning()
      .execute();

    trainerId = trainerResult[0].id;

    // Create prerequisite member
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane.doe@email.com',
        phone: '555-0456',
        date_of_birth: '1990-01-01',
        emergency_contact_name: 'John Doe',
        emergency_contact_phone: '555-0789'
      })
      .returning()
      .execute();

    memberId = memberResult[0].id;

    // Create prerequisite class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Morning Yoga',
        description: 'Relaxing morning yoga session',
        trainer_id: trainerId,
        max_capacity: 20,
        duration_minutes: 60,
        class_date: '2024-01-15',
        start_time: '08:00'
      })
      .returning()
      .execute();

    classId = classResult[0].id;
  });

  it('should create class attendance record successfully', async () => {
    const testInput: CreateClassAttendanceInput = {
      class_id: classId,
      member_id: memberId,
      attended: true,
      check_in_time: new Date('2024-01-15T08:05:00Z')
    };

    const result = await createClassAttendance(testInput);

    // Validate returned data
    expect(result.class_id).toEqual(classId);
    expect(result.member_id).toEqual(memberId);
    expect(result.attended).toEqual(true);
    expect(result.check_in_time).toEqual(testInput.check_in_time);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create attendance record with null check_in_time', async () => {
    const testInput: CreateClassAttendanceInput = {
      class_id: classId,
      member_id: memberId,
      attended: false,
      check_in_time: null
    };

    const result = await createClassAttendance(testInput);

    expect(result.attended).toEqual(false);
    expect(result.check_in_time).toBeNull();
    expect(result.class_id).toEqual(classId);
    expect(result.member_id).toEqual(memberId);
  });

  it('should save attendance record to database', async () => {
    const testInput: CreateClassAttendanceInput = {
      class_id: classId,
      member_id: memberId,
      attended: true,
      check_in_time: new Date('2024-01-15T08:10:00Z')
    };

    const result = await createClassAttendance(testInput);

    // Verify record exists in database
    const attendanceRecords = await db.select()
      .from(classAttendanceTable)
      .where(eq(classAttendanceTable.id, result.id))
      .execute();

    expect(attendanceRecords).toHaveLength(1);
    expect(attendanceRecords[0].class_id).toEqual(classId);
    expect(attendanceRecords[0].member_id).toEqual(memberId);
    expect(attendanceRecords[0].attended).toEqual(true);
    expect(attendanceRecords[0].check_in_time).toEqual(testInput.check_in_time);
    expect(attendanceRecords[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when class does not exist', async () => {
    const testInput: CreateClassAttendanceInput = {
      class_id: 99999, // Non-existent class ID
      member_id: memberId,
      attended: true,
      check_in_time: null
    };

    expect(createClassAttendance(testInput)).rejects.toThrow(/class with id 99999 does not exist/i);
  });

  it('should throw error when member does not exist', async () => {
    const testInput: CreateClassAttendanceInput = {
      class_id: classId,
      member_id: 99999, // Non-existent member ID
      attended: true,
      check_in_time: null
    };

    expect(createClassAttendance(testInput)).rejects.toThrow(/member with id 99999 does not exist/i);
  });

  it('should throw error when duplicate attendance record exists', async () => {
    const testInput: CreateClassAttendanceInput = {
      class_id: classId,
      member_id: memberId,
      attended: true,
      check_in_time: new Date('2024-01-15T08:00:00Z')
    };

    // Create first attendance record
    await createClassAttendance(testInput);

    // Attempt to create duplicate
    const duplicateInput: CreateClassAttendanceInput = {
      class_id: classId,
      member_id: memberId,
      attended: false,
      check_in_time: null
    };

    expect(createClassAttendance(duplicateInput)).rejects.toThrow(
      /attendance record already exists for member \d+ in class \d+/i
    );
  });

  it('should allow attendance records for different members in same class', async () => {
    // Create second member
    const secondMemberResult = await db.insert(membersTable)
      .values({
        first_name: 'Bob',
        last_name: 'Wilson',
        email: 'bob.wilson@email.com',
        phone: '555-0999'
      })
      .returning()
      .execute();

    const secondMemberId = secondMemberResult[0].id;

    const firstAttendance: CreateClassAttendanceInput = {
      class_id: classId,
      member_id: memberId,
      attended: true,
      check_in_time: new Date('2024-01-15T08:00:00Z')
    };

    const secondAttendance: CreateClassAttendanceInput = {
      class_id: classId,
      member_id: secondMemberId,
      attended: false,
      check_in_time: null
    };

    const result1 = await createClassAttendance(firstAttendance);
    const result2 = await createClassAttendance(secondAttendance);

    expect(result1.member_id).toEqual(memberId);
    expect(result1.attended).toEqual(true);
    expect(result2.member_id).toEqual(secondMemberId);
    expect(result2.attended).toEqual(false);

    // Verify both records exist in database
    const allAttendance = await db.select()
      .from(classAttendanceTable)
      .where(eq(classAttendanceTable.class_id, classId))
      .execute();

    expect(allAttendance).toHaveLength(2);
  });

  it('should allow attendance records for same member in different classes', async () => {
    // Create second class
    const secondClassResult = await db.insert(classesTable)
      .values({
        name: 'Evening Pilates',
        description: 'Evening pilates session',
        trainer_id: trainerId,
        max_capacity: 15,
        duration_minutes: 45,
        class_date: '2024-01-16',
        start_time: '18:00'
      })
      .returning()
      .execute();

    const secondClassId = secondClassResult[0].id;

    const firstAttendance: CreateClassAttendanceInput = {
      class_id: classId,
      member_id: memberId,
      attended: true,
      check_in_time: new Date('2024-01-15T08:00:00Z')
    };

    const secondAttendance: CreateClassAttendanceInput = {
      class_id: secondClassId,
      member_id: memberId,
      attended: true,
      check_in_time: new Date('2024-01-16T18:05:00Z')
    };

    const result1 = await createClassAttendance(firstAttendance);
    const result2 = await createClassAttendance(secondAttendance);

    expect(result1.class_id).toEqual(classId);
    expect(result1.member_id).toEqual(memberId);
    expect(result2.class_id).toEqual(secondClassId);
    expect(result2.member_id).toEqual(memberId);

    // Verify both records exist in database
    const memberAttendance = await db.select()
      .from(classAttendanceTable)
      .where(eq(classAttendanceTable.member_id, memberId))
      .execute();

    expect(memberAttendance).toHaveLength(2);
  });
});