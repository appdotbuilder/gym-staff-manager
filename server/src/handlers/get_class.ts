import { db } from '../db';
import { classesTable } from '../db/schema';
import { type Class } from '../schema';
import { eq } from 'drizzle-orm';

export const getClass = async (id: number): Promise<Class> => {
  try {
    const results = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, id))
      .execute();

    if (results.length === 0) {
      throw new Error(`Class with id ${id} not found`);
    }

    const classData = results[0];
    return {
      ...classData,
      class_date: new Date(classData.class_date), // Convert string to Date
      // No numeric conversion needed for this table - all numeric fields are integers
    };
  } catch (error) {
    console.error('Get class failed:', error);
    throw error;
  }
};