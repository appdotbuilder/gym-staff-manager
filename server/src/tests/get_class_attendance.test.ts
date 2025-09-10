import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, trainersTable, classesTable, classAttendanceTable } from '../db/schema';
import { getClassAttendance } from '../handlers/get_class_attendance';

describe('getClassAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for class with no attendance records', async () => {
    // Create trainer first
    const trainerResult = await db.insert(trainersTable)
      .values({
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@gym.com',
        phone: '123-456-7890',
        specialization: 'Cardio',
        hourly_rate: '50.00'
      })
      .returning()
      .execute();

    // Create class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Morning Yoga',
        description: 'Relaxing yoga session',
        trainer_id: trainerResult[0].id,
        max_capacity: 20,
        duration_minutes: 60,
        class_date: '2024-01-15',
        start_time: '09:00'
      })
      .returning()
      .execute();

    const attendance = await getClassAttendance(classResult[0].id);

    expect(attendance).toEqual([]);
    expect(attendance).toHaveLength(0);
  });

  it('should return attendance records for a specific class', async () => {
    // Create trainer
    const trainerResult = await db.insert(trainersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane.doe@gym.com',
        phone: '987-654-3210',
        specialization: 'Strength Training',
        hourly_rate: '60.00'
      })
      .returning()
      .execute();

    // Create members
    const member1Result = await db.insert(membersTable)
      .values({
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice.johnson@example.com',
        phone: '555-0001',
        date_of_birth: '1990-05-15',
        emergency_contact_name: 'Bob Johnson',
        emergency_contact_phone: '555-0002',
        medical_conditions: null
      })
      .returning()
      .execute();

    const member2Result = await db.insert(membersTable)
      .values({
        first_name: 'Bob',
        last_name: 'Wilson',
        email: 'bob.wilson@example.com',
        phone: '555-0003',
        date_of_birth: '1985-08-22',
        emergency_contact_name: 'Carol Wilson',
        emergency_contact_phone: '555-0004',
        medical_conditions: 'None'
      })
      .returning()
      .execute();

    // Create class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Evening Pilates',
        description: 'Core strengthening pilates',
        trainer_id: trainerResult[0].id,
        max_capacity: 15,
        duration_minutes: 45,
        class_date: '2024-01-20',
        start_time: '18:00'
      })
      .returning()
      .execute();

    // Create attendance records
    const checkInTime = new Date('2024-01-20T18:05:00Z');
    await db.insert(classAttendanceTable)
      .values([
        {
          class_id: classResult[0].id,
          member_id: member1Result[0].id,
          attended: true,
          check_in_time: checkInTime
        },
        {
          class_id: classResult[0].id,
          member_id: member2Result[0].id,
          attended: false,
          check_in_time: null
        }
      ])
      .execute();

    const attendance = await getClassAttendance(classResult[0].id);

    expect(attendance).toHaveLength(2);

    // Verify first attendance record
    const attendedRecord = attendance.find(record => record.attended === true);
    expect(attendedRecord).toBeDefined();
    expect(attendedRecord!.class_id).toEqual(classResult[0].id);
    expect(attendedRecord!.member_id).toEqual(member1Result[0].id);
    expect(attendedRecord!.attended).toBe(true);
    expect(attendedRecord!.check_in_time).toBeInstanceOf(Date);
    expect(attendedRecord!.created_at).toBeInstanceOf(Date);
    expect(attendedRecord!.id).toBeDefined();

    // Verify second attendance record
    const absentRecord = attendance.find(record => record.attended === false);
    expect(absentRecord).toBeDefined();
    expect(absentRecord!.class_id).toEqual(classResult[0].id);
    expect(absentRecord!.member_id).toEqual(member2Result[0].id);
    expect(absentRecord!.attended).toBe(false);
    expect(absentRecord!.check_in_time).toBeNull();
    expect(absentRecord!.created_at).toBeInstanceOf(Date);
    expect(absentRecord!.id).toBeDefined();
  });

  it('should return only attendance for the specified class', async () => {
    // Create trainer
    const trainerResult = await db.insert(trainersTable)
      .values({
        first_name: 'Mike',
        last_name: 'Brown',
        email: 'mike.brown@gym.com',
        phone: '111-222-3333',
        specialization: 'CrossFit',
        hourly_rate: '70.00'
      })
      .returning()
      .execute();

    // Create member
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: 'Sarah',
        last_name: 'Davis',
        email: 'sarah.davis@example.com',
        phone: '444-555-6666',
        date_of_birth: '1992-12-10',
        emergency_contact_name: 'Tom Davis',
        emergency_contact_phone: '444-555-7777',
        medical_conditions: null
      })
      .returning()
      .execute();

    // Create two different classes
    const class1Result = await db.insert(classesTable)
      .values({
        name: 'Morning CrossFit',
        description: 'High intensity workout',
        trainer_id: trainerResult[0].id,
        max_capacity: 12,
        duration_minutes: 60,
        class_date: '2024-01-25',
        start_time: '07:00'
      })
      .returning()
      .execute();

    const class2Result = await db.insert(classesTable)
      .values({
        name: 'Evening CrossFit',
        description: 'Another high intensity workout',
        trainer_id: trainerResult[0].id,
        max_capacity: 12,
        duration_minutes: 60,
        class_date: '2024-01-25',
        start_time: '19:00'
      })
      .returning()
      .execute();

    // Create attendance records for both classes
    await db.insert(classAttendanceTable)
      .values([
        {
          class_id: class1Result[0].id,
          member_id: memberResult[0].id,
          attended: true,
          check_in_time: new Date('2024-01-25T07:05:00Z')
        },
        {
          class_id: class2Result[0].id,
          member_id: memberResult[0].id,
          attended: true,
          check_in_time: new Date('2024-01-25T19:05:00Z')
        }
      ])
      .execute();

    // Get attendance for first class only
    const attendance = await getClassAttendance(class1Result[0].id);

    expect(attendance).toHaveLength(1);
    expect(attendance[0].class_id).toEqual(class1Result[0].id);
    expect(attendance[0].member_id).toEqual(memberResult[0].id);
    expect(attendance[0].attended).toBe(true);
  });

  it('should handle non-existent class id gracefully', async () => {
    const attendance = await getClassAttendance(999999);

    expect(attendance).toEqual([]);
    expect(attendance).toHaveLength(0);
  });

  it('should return attendance records with correct date handling', async () => {
    // Create trainer
    const trainerResult = await db.insert(trainersTable)
      .values({
        first_name: 'Lisa',
        last_name: 'White',
        email: 'lisa.white@gym.com',
        phone: '777-888-9999',
        specialization: 'Zumba',
        hourly_rate: '45.00'
      })
      .returning()
      .execute();

    // Create member
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: 'Emma',
        last_name: 'Taylor',
        email: 'emma.taylor@example.com',
        phone: '666-777-8888',
        date_of_birth: '1988-03-14',
        emergency_contact_name: 'James Taylor',
        emergency_contact_phone: '666-777-9999',
        medical_conditions: 'Knee injury - modified exercises'
      })
      .returning()
      .execute();

    // Create class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Zumba Dance',
        description: 'Fun dance fitness',
        trainer_id: trainerResult[0].id,
        max_capacity: 25,
        duration_minutes: 50,
        class_date: '2024-02-01',
        start_time: '20:00'
      })
      .returning()
      .execute();

    // Create attendance record with specific check-in time
    const specificCheckIn = new Date('2024-02-01T20:10:00Z');
    await db.insert(classAttendanceTable)
      .values({
        class_id: classResult[0].id,
        member_id: memberResult[0].id,
        attended: true,
        check_in_time: specificCheckIn
      })
      .execute();

    const attendance = await getClassAttendance(classResult[0].id);

    expect(attendance).toHaveLength(1);
    expect(attendance[0].check_in_time).toBeInstanceOf(Date);
    expect(attendance[0].check_in_time!.getTime()).toEqual(specificCheckIn.getTime());
    expect(attendance[0].created_at).toBeInstanceOf(Date);
    expect(attendance[0].created_at.getTime()).toBeGreaterThan(0);
  });
});