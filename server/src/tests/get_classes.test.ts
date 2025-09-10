import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { trainersTable, classesTable } from '../db/schema';
import { getClasses } from '../handlers/get_classes';

describe('getClasses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no classes exist', async () => {
    const result = await getClasses();
    expect(result).toEqual([]);
  });

  it('should return all classes ordered by date and time', async () => {
    // Create a trainer first (required for classes)
    const trainer = await db.insert(trainersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-0123',
        specialization: 'Yoga',
        hourly_rate: '50.00',
        hire_date: '2023-01-01',
        is_active: true,
      })
      .returning()
      .execute();

    // Create classes with different dates and times
    const testClasses = [
      {
        name: 'Morning Yoga',
        description: 'Relaxing morning yoga session',
        trainer_id: trainer[0].id,
        max_capacity: 20,
        duration_minutes: 60,
        class_date: '2024-01-15',
        start_time: '09:00',
        is_cancelled: false,
      },
      {
        name: 'Evening Pilates',
        description: 'Core strengthening pilates',
        trainer_id: trainer[0].id,
        max_capacity: 15,
        duration_minutes: 45,
        class_date: '2024-01-14',
        start_time: '18:00',
        is_cancelled: false,
      },
      {
        name: 'Afternoon Strength',
        description: 'Full body strength training',
        trainer_id: trainer[0].id,
        max_capacity: 12,
        duration_minutes: 90,
        class_date: '2024-01-15',
        start_time: '14:30',
        is_cancelled: true,
      }
    ];

    await db.insert(classesTable)
      .values(testClasses)
      .execute();

    const result = await getClasses();

    // Should return 3 classes
    expect(result).toHaveLength(3);

    // Should be ordered by date first, then by time
    expect(result[0].name).toEqual('Evening Pilates'); // 2024-01-14
    expect(result[1].name).toEqual('Morning Yoga');    // 2024-01-15 09:00
    expect(result[2].name).toEqual('Afternoon Strength'); // 2024-01-15 14:30

    // Verify all fields are present and correct
    const firstClass = result[0];
    expect(firstClass.id).toBeDefined();
    expect(firstClass.name).toEqual('Evening Pilates');
    expect(firstClass.description).toEqual('Core strengthening pilates');
    expect(firstClass.trainer_id).toEqual(trainer[0].id);
    expect(firstClass.max_capacity).toEqual(15);
    expect(firstClass.duration_minutes).toEqual(45);
    expect(firstClass.class_date).toBeInstanceOf(Date);
    expect(firstClass.start_time).toEqual('18:00:00'); // PostgreSQL returns time with seconds
    expect(firstClass.is_cancelled).toEqual(false);
    expect(firstClass.created_at).toBeInstanceOf(Date);
  });

  it('should include cancelled classes in results', async () => {
    // Create a trainer first
    const trainer = await db.insert(trainersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        phone: '555-0456',
        specialization: 'CrossFit',
        hourly_rate: '75.00',
        hire_date: '2023-02-01',
        is_active: true,
      })
      .returning()
      .execute();

    // Create both active and cancelled classes
    await db.insert(classesTable)
      .values([
        {
          name: 'Active Class',
          description: 'This class is active',
          trainer_id: trainer[0].id,
          max_capacity: 10,
          duration_minutes: 60,
          class_date: '2024-01-16',
          start_time: '10:00',
          is_cancelled: false,
        },
        {
          name: 'Cancelled Class',
          description: 'This class is cancelled',
          trainer_id: trainer[0].id,
          max_capacity: 10,
          duration_minutes: 60,
          class_date: '2024-01-16',
          start_time: '11:00',
          is_cancelled: true,
        }
      ])
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(2);
    expect(result.some(c => c.is_cancelled === true)).toBe(true);
    expect(result.some(c => c.is_cancelled === false)).toBe(true);
  });

  it('should handle classes with same date but different times correctly', async () => {
    // Create a trainer first
    const trainer = await db.insert(trainersTable)
      .values({
        first_name: 'Mike',
        last_name: 'Johnson',
        email: 'mike@example.com',
        phone: '555-0789',
        specialization: 'Cardio',
        hourly_rate: '40.00',
        hire_date: '2023-03-01',
        is_active: true,
      })
      .returning()
      .execute();

    // Create multiple classes on the same date with different times
    const sameDate = '2024-01-20';
    const times = ['08:00', '12:30', '16:15', '19:45'];
    const classNames = ['Early Morning', 'Lunch Time', 'Afternoon', 'Evening'];

    for (let i = 0; i < times.length; i++) {
      await db.insert(classesTable)
        .values({
          name: `${classNames[i]} Class`,
          description: `Class at ${times[i]}`,
          trainer_id: trainer[0].id,
          max_capacity: 10,
          duration_minutes: 60,
          class_date: sameDate,
          start_time: times[i],
          is_cancelled: false,
        })
        .execute();
    }

    const result = await getClasses();

    expect(result).toHaveLength(4);
    
    // Should be ordered by start_time
    expect(result[0].name).toEqual('Early Morning Class');
    expect(result[1].name).toEqual('Lunch Time Class');
    expect(result[2].name).toEqual('Afternoon Class');
    expect(result[3].name).toEqual('Evening Class');

    // Verify times are in order
    const resultTimes = result.map(c => c.start_time);
    expect(resultTimes).toEqual(['08:00:00', '12:30:00', '16:15:00', '19:45:00']);
  });
});