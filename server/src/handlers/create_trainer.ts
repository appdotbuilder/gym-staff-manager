import { db } from '../db';
import { trainersTable } from '../db/schema';
import { type CreateTrainerInput, type Trainer } from '../schema';

export const createTrainer = async (input: CreateTrainerInput): Promise<Trainer> => {
  try {
    // Insert trainer record
    const result = await db.insert(trainersTable)
      .values({
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone: input.phone,
        specialization: input.specialization,
        hourly_rate: input.hourly_rate?.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric and date fields back to proper types before returning
    const trainer = result[0];
    return {
      ...trainer,
      hourly_rate: trainer.hourly_rate ? parseFloat(trainer.hourly_rate) : null, // Convert string back to number
      hire_date: new Date(trainer.hire_date), // Convert date string to Date
      created_at: trainer.created_at // This is already a Date object from timestamp column
    };
  } catch (error) {
    console.error('Trainer creation failed:', error);
    throw error;
  }
};