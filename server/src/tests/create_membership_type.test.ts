import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membershipTypesTable } from '../db/schema';
import { type CreateMembershipTypeInput } from '../schema';
import { createMembershipType } from '../handlers/create_membership_type';
import { eq, gte, between, and } from 'drizzle-orm';

// Simple test input
const testInput: CreateMembershipTypeInput = {
  name: 'Premium Monthly',
  description: 'Premium membership with full access',
  duration_months: 1,
  price: 99.99
};

describe('createMembershipType', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a membership type', async () => {
    const result = await createMembershipType(testInput);

    // Basic field validation
    expect(result.name).toEqual('Premium Monthly');
    expect(result.description).toEqual(testInput.description);
    expect(result.duration_months).toEqual(1);
    expect(result.price).toEqual(99.99);
    expect(typeof result.price).toBe('number');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save membership type to database', async () => {
    const result = await createMembershipType(testInput);

    // Query using proper drizzle syntax
    const membershipTypes = await db.select()
      .from(membershipTypesTable)
      .where(eq(membershipTypesTable.id, result.id))
      .execute();

    expect(membershipTypes).toHaveLength(1);
    expect(membershipTypes[0].name).toEqual('Premium Monthly');
    expect(membershipTypes[0].description).toEqual(testInput.description);
    expect(membershipTypes[0].duration_months).toEqual(1);
    expect(parseFloat(membershipTypes[0].price)).toEqual(99.99);
    expect(membershipTypes[0].is_active).toBe(true);
    expect(membershipTypes[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null description', async () => {
    const inputWithNullDescription: CreateMembershipTypeInput = {
      name: 'Basic Monthly',
      description: null,
      duration_months: 1,
      price: 49.99
    };

    const result = await createMembershipType(inputWithNullDescription);

    expect(result.name).toEqual('Basic Monthly');
    expect(result.description).toBeNull();
    expect(result.duration_months).toEqual(1);
    expect(result.price).toEqual(49.99);
    expect(result.is_active).toBe(true);
  });

  it('should handle different duration and price combinations', async () => {
    const annualInput: CreateMembershipTypeInput = {
      name: 'Annual Premium',
      description: 'Annual premium membership',
      duration_months: 12,
      price: 999.99
    };

    const result = await createMembershipType(annualInput);

    expect(result.name).toEqual('Annual Premium');
    expect(result.duration_months).toEqual(12);
    expect(result.price).toEqual(999.99);
    expect(typeof result.price).toBe('number');
  });

  it('should query membership types by date range correctly', async () => {
    // Create test membership type
    await createMembershipType(testInput);

    // Test date filtering - demonstration of correct date handling
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Apply date filter - Date objects work directly with timestamp columns
    const membershipTypes = await db.select()
      .from(membershipTypesTable)
      .where(
        and(
          gte(membershipTypesTable.created_at, yesterday),
          between(membershipTypesTable.created_at, yesterday, tomorrow)
        )
      )
      .execute();

    expect(membershipTypes.length).toBeGreaterThan(0);
    membershipTypes.forEach(membershipType => {
      expect(membershipType.created_at).toBeInstanceOf(Date);
      expect(membershipType.created_at >= yesterday).toBe(true);
      expect(membershipType.created_at <= tomorrow).toBe(true);
    });
  });

  it('should handle decimal prices correctly', async () => {
    const preciseInput: CreateMembershipTypeInput = {
      name: 'Student Discount',
      description: 'Discounted membership for students',
      duration_months: 3,
      price: 79.95
    };

    const result = await createMembershipType(preciseInput);

    expect(result.price).toEqual(79.95);
    expect(typeof result.price).toBe('number');

    // Verify in database
    const saved = await db.select()
      .from(membershipTypesTable)
      .where(eq(membershipTypesTable.id, result.id))
      .execute();

    expect(parseFloat(saved[0].price)).toEqual(79.95);
  });

  it('should create multiple membership types with unique names', async () => {
    const input1: CreateMembershipTypeInput = {
      name: 'Basic',
      description: 'Basic membership',
      duration_months: 1,
      price: 29.99
    };

    const input2: CreateMembershipTypeInput = {
      name: 'Premium',
      description: 'Premium membership',
      duration_months: 1,
      price: 59.99
    };

    const result1 = await createMembershipType(input1);
    const result2 = await createMembershipType(input2);

    expect(result1.name).toEqual('Basic');
    expect(result2.name).toEqual('Premium');
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.price).toEqual(29.99);
    expect(result2.price).toEqual(59.99);

    // Verify both are in database
    const allMembershipTypes = await db.select()
      .from(membershipTypesTable)
      .execute();

    expect(allMembershipTypes).toHaveLength(2);
  });
});