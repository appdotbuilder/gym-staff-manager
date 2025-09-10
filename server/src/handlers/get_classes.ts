import { db } from '../db';
import { classesTable } from '../db/schema';
import { type Class } from '../schema';
import { asc } from 'drizzle-orm';

export async function getClasses(): Promise<Class[]> {
  try {
    // Fetch all classes ordered by date and time
    const results = await db.select()
      .from(classesTable)
      .orderBy(asc(classesTable.class_date), asc(classesTable.start_time))
      .execute();

    // Convert date strings to Date objects to match schema
    return results.map(classItem => ({
      ...classItem,
      class_date: new Date(classItem.class_date),
    }));
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    throw error;
  }
}