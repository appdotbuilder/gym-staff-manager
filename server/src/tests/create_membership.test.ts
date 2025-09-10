import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membershipsTable, membersTable, membershipTypesTable } from '../db/schema';
import { type CreateMembershipInput } from '../schema';
import { createMembership } from '../handlers/create_membership';
import { eq } from 'drizzle-orm';

describe('createMembership', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testMemberId: number;
  let testMembershipTypeId: number;

  beforeEach(async () => {
    // Create test member
    const memberResult = await db.insert(membersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        date_of_birth: '1990-01-01', // Use string format for date column
        emergency_contact_name: 'Jane Doe',
        emergency_contact_phone: '+1234567891',
        medical_conditions: null
      })
      .returning()
      .execute();
    
    testMemberId = memberResult[0].id;

    // Create test membership type
    const membershipTypeResult = await db.insert(membershipTypesTable)
      .values({
        name: 'Premium Monthly',
        description: 'Premium membership with full access',
        duration_months: 1,
        price: (99.99).toString(), // Convert number to string for numeric column
        is_active: true
      })
      .returning()
      .execute();
    
    testMembershipTypeId = membershipTypeResult[0].id;
  });

  it('should create a membership with default start date', async () => {
    const input: CreateMembershipInput = {
      member_id: testMemberId,
      membership_type_id: testMembershipTypeId
    };

    const result = await createMembership(input);

    expect(result.member_id).toEqual(testMemberId);
    expect(result.membership_type_id).toEqual(testMembershipTypeId);
    expect(result.status).toEqual('active');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.end_date).toBeInstanceOf(Date);

    // Verify end date is calculated correctly (1 month from start date)
    const expectedEndDate = new Date(result.start_date);
    expectedEndDate.setMonth(expectedEndDate.getMonth() + 1);
    expect(result.end_date.getTime()).toEqual(expectedEndDate.getTime());
  });

  it('should create a membership with custom start date', async () => {
    const startDate = new Date('2024-06-01');
    const input: CreateMembershipInput = {
      member_id: testMemberId,
      membership_type_id: testMembershipTypeId,
      start_date: startDate
    };

    const result = await createMembership(input);

    expect(result.start_date.getTime()).toEqual(startDate.getTime());
    
    // Verify end date is calculated correctly from custom start date
    const expectedEndDate = new Date(startDate);
    expectedEndDate.setMonth(expectedEndDate.getMonth() + 1);
    expect(result.end_date.getTime()).toEqual(expectedEndDate.getTime());
  });

  it('should calculate end date based on membership type duration', async () => {
    // Create a 3-month membership type
    const longMembershipTypeResult = await db.insert(membershipTypesTable)
      .values({
        name: 'Quarterly',
        description: 'Three month membership',
        duration_months: 3,
        price: (249.99).toString(), // Convert number to string for numeric column
        is_active: true
      })
      .returning()
      .execute();

    const startDate = new Date('2024-01-01');
    const input: CreateMembershipInput = {
      member_id: testMemberId,
      membership_type_id: longMembershipTypeResult[0].id,
      start_date: startDate
    };

    const result = await createMembership(input);

    // Should be 3 months from start date
    const expectedEndDate = new Date(startDate);
    expectedEndDate.setMonth(expectedEndDate.getMonth() + 3);
    expect(result.end_date.getTime()).toEqual(expectedEndDate.getTime());
  });

  it('should save membership to database', async () => {
    const input: CreateMembershipInput = {
      member_id: testMemberId,
      membership_type_id: testMembershipTypeId
    };

    const result = await createMembership(input);

    // Query the database to verify the membership was saved
    const memberships = await db.select()
      .from(membershipsTable)
      .where(eq(membershipsTable.id, result.id))
      .execute();

    expect(memberships).toHaveLength(1);
    expect(memberships[0].member_id).toEqual(testMemberId);
    expect(memberships[0].membership_type_id).toEqual(testMembershipTypeId);
    expect(memberships[0].status).toEqual('active');
    expect(memberships[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent member', async () => {
    const input: CreateMembershipInput = {
      member_id: 99999, // Non-existent member ID
      membership_type_id: testMembershipTypeId
    };

    await expect(createMembership(input)).rejects.toThrow(/Member with id 99999 not found/i);
  });

  it('should throw error for non-existent membership type', async () => {
    const input: CreateMembershipInput = {
      member_id: testMemberId,
      membership_type_id: 99999 // Non-existent membership type ID
    };

    await expect(createMembership(input)).rejects.toThrow(/Membership type with id 99999 not found/i);
  });

  it('should throw error for inactive membership type', async () => {
    // Create an inactive membership type
    const inactiveMembershipTypeResult = await db.insert(membershipTypesTable)
      .values({
        name: 'Inactive Type',
        description: 'This membership type is inactive',
        duration_months: 1,
        price: (99.99).toString(), // Convert number to string for numeric column
        is_active: false
      })
      .returning()
      .execute();

    const input: CreateMembershipInput = {
      member_id: testMemberId,
      membership_type_id: inactiveMembershipTypeResult[0].id
    };

    await expect(createMembership(input)).rejects.toThrow(/Membership type .* is not active/i);
  });

  it('should handle year boundary correctly in date calculation', async () => {
    const startDate = new Date('2024-12-15');
    const input: CreateMembershipInput = {
      member_id: testMemberId,
      membership_type_id: testMembershipTypeId,
      start_date: startDate
    };

    const result = await createMembership(input);

    // End date should be in the next year
    const expectedEndDate = new Date(startDate);
    expectedEndDate.setMonth(expectedEndDate.getMonth() + 1);
    expect(result.end_date.getTime()).toEqual(expectedEndDate.getTime());
    expect(result.end_date.getFullYear()).toEqual(2025);
    expect(result.end_date.getMonth()).toEqual(0); // January
  });
});