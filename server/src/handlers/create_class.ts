import { db } from '../db';
import { classesTable, trainersTable } from '../db/schema';
import { type CreateClassInput, type Class } from '../schema';
import { eq } from 'drizzle-orm';

export const createClass = async (input: CreateClassInput): Promise<Class> => {
  try {
    // Verify that the trainer exists first to prevent foreign key constraint violations
    const trainer = await db.select()
      .from(trainersTable)
      .where(eq(trainersTable.id, input.trainer_id))
      .execute();

    if (trainer.length === 0) {
      throw new Error(`Trainer with id ${input.trainer_id} not found`);
    }

    // Insert the new class record
    const result = await db.insert(classesTable)
      .values({
        name: input.name,
        description: input.description,
        trainer_id: input.trainer_id,
        max_capacity: input.max_capacity,
        duration_minutes: input.duration_minutes,
        class_date: input.class_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        start_time: input.start_time
      })
      .returning()
      .execute();

    const createdClass = result[0];
    return {
      ...createdClass,
      // Convert date strings to Date objects for proper typing
      class_date: new Date(createdClass.class_date),
      created_at: createdClass.created_at
    };
  } catch (error) {
    console.error('Class creation failed:', error);
    throw error;
  }
};