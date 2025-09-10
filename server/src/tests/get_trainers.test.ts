import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { trainersTable } from '../db/schema';
import { getTrainers } from '../handlers/get_trainers';

describe('getTrainers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no trainers exist', async () => {
    const result = await getTrainers();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all trainers', async () => {
    // Create test trainers
    await db.insert(trainersTable)
      .values([
        {
          first_name: 'John',
          last_name: 'Smith',
          email: 'john@gym.com',
          phone: '123-456-7890',
          specialization: 'Weight Training',
          hourly_rate: '75.50',
          is_active: true
        },
        {
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah@gym.com',
          phone: null,
          specialization: 'Yoga',
          hourly_rate: '60.00',
          is_active: false
        },
        {
          first_name: 'Mike',
          last_name: 'Wilson',
          email: 'mike@gym.com',
          phone: '555-0123',
          specialization: null,
          hourly_rate: null,
          is_active: true
        }
      ])
      .execute();

    const result = await getTrainers();

    expect(result).toHaveLength(3);
    
    // Verify first trainer
    const johnTrainer = result.find(t => t.email === 'john@gym.com');
    expect(johnTrainer).toBeDefined();
    expect(johnTrainer!.first_name).toEqual('John');
    expect(johnTrainer!.last_name).toEqual('Smith');
    expect(johnTrainer!.phone).toEqual('123-456-7890');
    expect(johnTrainer!.specialization).toEqual('Weight Training');
    expect(johnTrainer!.hourly_rate).toEqual(75.50);
    expect(typeof johnTrainer!.hourly_rate).toEqual('number');
    expect(johnTrainer!.is_active).toEqual(true);
    expect(johnTrainer!.id).toBeDefined();
    expect(johnTrainer!.hire_date).toBeInstanceOf(Date);
    expect(johnTrainer!.created_at).toBeInstanceOf(Date);

    // Verify second trainer (inactive)
    const sarahTrainer = result.find(t => t.email === 'sarah@gym.com');
    expect(sarahTrainer).toBeDefined();
    expect(sarahTrainer!.first_name).toEqual('Sarah');
    expect(sarahTrainer!.last_name).toEqual('Johnson');
    expect(sarahTrainer!.phone).toBeNull();
    expect(sarahTrainer!.specialization).toEqual('Yoga');
    expect(sarahTrainer!.hourly_rate).toEqual(60.00);
    expect(typeof sarahTrainer!.hourly_rate).toEqual('number');
    expect(sarahTrainer!.is_active).toEqual(false);

    // Verify third trainer (null values)
    const mikeTrainer = result.find(t => t.email === 'mike@gym.com');
    expect(mikeTrainer).toBeDefined();
    expect(mikeTrainer!.first_name).toEqual('Mike');
    expect(mikeTrainer!.last_name).toEqual('Wilson');
    expect(mikeTrainer!.phone).toEqual('555-0123');
    expect(mikeTrainer!.specialization).toBeNull();
    expect(mikeTrainer!.hourly_rate).toBeNull();
    expect(mikeTrainer!.is_active).toEqual(true);
  });

  it('should handle numeric conversion correctly', async () => {
    // Create trainer with decimal hourly rate
    await db.insert(trainersTable)
      .values({
        first_name: 'Test',
        last_name: 'Trainer',
        email: 'test@gym.com',
        hourly_rate: '123.45',
        is_active: true
      })
      .execute();

    const result = await getTrainers();

    expect(result).toHaveLength(1);
    expect(result[0].hourly_rate).toEqual(123.45);
    expect(typeof result[0].hourly_rate).toEqual('number');
  });

  it('should return trainers ordered by database order', async () => {
    // Create trainers in specific order
    const trainerData = [
      { first_name: 'Alice', last_name: 'Brown', email: 'alice@gym.com' },
      { first_name: 'Bob', last_name: 'Davis', email: 'bob@gym.com' },
      { first_name: 'Charlie', last_name: 'Evans', email: 'charlie@gym.com' }
    ];

    for (const trainer of trainerData) {
      await db.insert(trainersTable)
        .values({
          ...trainer,
          is_active: true
        })
        .execute();
    }

    const result = await getTrainers();

    expect(result).toHaveLength(3);
    // Should maintain insertion order (by id)
    expect(result[0].first_name).toEqual('Alice');
    expect(result[1].first_name).toEqual('Bob');
    expect(result[2].first_name).toEqual('Charlie');
  });

  it('should include both active and inactive trainers', async () => {
    // Create mix of active and inactive trainers
    await db.insert(trainersTable)
      .values([
        {
          first_name: 'Active',
          last_name: 'Trainer',
          email: 'active@gym.com',
          is_active: true
        },
        {
          first_name: 'Inactive',
          last_name: 'Trainer',
          email: 'inactive@gym.com',
          is_active: false
        }
      ])
      .execute();

    const result = await getTrainers();

    expect(result).toHaveLength(2);
    
    const activeTrainer = result.find(t => t.email === 'active@gym.com');
    const inactiveTrainer = result.find(t => t.email === 'inactive@gym.com');
    
    expect(activeTrainer).toBeDefined();
    expect(activeTrainer!.is_active).toEqual(true);
    
    expect(inactiveTrainer).toBeDefined();
    expect(inactiveTrainer!.is_active).toEqual(false);
  });
});