import { db } from '../db';
import { trainersTable } from '../db/schema';
import { type UpdateTrainerInput, type Trainer } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTrainer = async (input: UpdateTrainerInput): Promise<Trainer> => {
  try {
    // Build update object only with provided fields
    const updateData: Record<string, any> = {};
    
    if (input.first_name !== undefined) {
      updateData['first_name'] = input.first_name;
    }
    
    if (input.last_name !== undefined) {
      updateData['last_name'] = input.last_name;
    }
    
    if (input.email !== undefined) {
      updateData['email'] = input.email;
    }
    
    if (input.phone !== undefined) {
      updateData['phone'] = input.phone;
    }
    
    if (input.specialization !== undefined) {
      updateData['specialization'] = input.specialization;
    }
    
    if (input.hourly_rate !== undefined) {
      updateData['hourly_rate'] = input.hourly_rate ? input.hourly_rate.toString() : null;
    }
    
    if (input.is_active !== undefined) {
      updateData['is_active'] = input.is_active;
    }

    // Check if trainer exists before attempting update
    const existingTrainer = await db.select()
      .from(trainersTable)
      .where(eq(trainersTable.id, input.id))
      .execute();

    if (existingTrainer.length === 0) {
      throw new Error(`Trainer with ID ${input.id} not found`);
    }

    // If no fields to update, return existing trainer
    if (Object.keys(updateData).length === 0) {
      const trainer = existingTrainer[0];
      return {
        ...trainer,
        hire_date: new Date(trainer.hire_date),
        created_at: new Date(trainer.created_at),
        hourly_rate: trainer.hourly_rate ? parseFloat(trainer.hourly_rate) : null
      };
    }

    // Update trainer record
    const result = await db.update(trainersTable)
      .set(updateData)
      .where(eq(trainersTable.id, input.id))
      .returning()
      .execute();

    // Convert fields back to proper types before returning
    const trainer = result[0];
    return {
      ...trainer,
      hire_date: new Date(trainer.hire_date),
      created_at: new Date(trainer.created_at),
      hourly_rate: trainer.hourly_rate ? parseFloat(trainer.hourly_rate) : null
    };
  } catch (error) {
    console.error('Trainer update failed:', error);
    throw error;
  }
};