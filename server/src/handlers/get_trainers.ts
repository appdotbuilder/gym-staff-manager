import { db } from '../db';
import { trainersTable } from '../db/schema';
import { type Trainer } from '../schema';

export const getTrainers = async (): Promise<Trainer[]> => {
  try {
    const results = await db.select()
      .from(trainersTable)
      .execute();

    // Convert numeric and date fields back to proper types for the schema
    return results.map(trainer => ({
      ...trainer,
      hourly_rate: trainer.hourly_rate ? parseFloat(trainer.hourly_rate) : null,
      hire_date: new Date(trainer.hire_date)
    }));
  } catch (error) {
    console.error('Failed to fetch trainers:', error);
    throw error;
  }
};