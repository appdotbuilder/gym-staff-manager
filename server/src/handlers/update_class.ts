import { db } from '../db';
import { classesTable } from '../db/schema';
import { type UpdateClassInput, type Class } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateClass(input: UpdateClassInput): Promise<Class> {
  try {
    // Build the update object dynamically, only including fields that are provided
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.trainer_id !== undefined) {
      updateData.trainer_id = input.trainer_id;
    }
    
    if (input.max_capacity !== undefined) {
      updateData.max_capacity = input.max_capacity;
    }
    
    if (input.duration_minutes !== undefined) {
      updateData.duration_minutes = input.duration_minutes;
    }
    
    if (input.class_date !== undefined) {
      updateData.class_date = input.class_date;
    }
    
    if (input.start_time !== undefined) {
      updateData.start_time = input.start_time;
    }
    
    if (input.is_cancelled !== undefined) {
      updateData.is_cancelled = input.is_cancelled;
    }

    // Update the class record
    const result = await db.update(classesTable)
      .set(updateData)
      .where(eq(classesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Class with id ${input.id} not found`);
    }

    // Convert date string back to Date object for schema compliance
    const classData = result[0];
    return {
      ...classData,
      class_date: new Date(classData.class_date),
      created_at: new Date(classData.created_at)
    };
  } catch (error) {
    console.error('Class update failed:', error);
    throw error;
  }
}