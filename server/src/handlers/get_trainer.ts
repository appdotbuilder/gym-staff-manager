import { db } from '../db';
import { trainersTable } from '../db/schema';
import { type Trainer } from '../schema';
import { eq } from 'drizzle-orm';

export const getTrainer = async (id: number): Promise<Trainer> => {
  try {
    const results = await db.select()
      .from(trainersTable)
      .where(eq(trainersTable.id, id))
      .execute();

    if (results.length === 0) {
      throw new Error(`Trainer with ID ${id} not found`);
    }

    const trainer = results[0];
    
    // Convert numeric and date fields for the response
    return {
      ...trainer,
      hourly_rate: trainer.hourly_rate ? parseFloat(trainer.hourly_rate) : null,
      hire_date: new Date(trainer.hire_date),
      created_at: trainer.created_at, // This is already a Date object from timestamp type
    };
  } catch (error) {
    console.error('Get trainer failed:', error);
    throw error;
  }
};