import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membersTable, membershipTypesTable, membershipsTable } from '../db/schema';
import { getMemberships } from '../handlers/get_memberships';

describe('getMemberships', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no memberships exist', async () => {
    const result = await getMemberships();
    
    expect(result).toEqual([]);
  });

  it('should return all memberships', async () => {
    // Create test member first
    const memberResults = await db.insert(membersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        join_date: '2024-01-01'
      })
      .returning()
      .execute();
    
    const memberId = memberResults[0].id;

    // Create test membership type
    const membershipTypeResults = await db.insert(membershipTypesTable)
      .values({
        name: 'Premium',
        description: 'Premium membership',
        duration_months: 12,
        price: '99.99'
      })
      .returning()
      .execute();
    
    const membershipTypeId = membershipTypeResults[0].id;

    // Create test memberships
    await db.insert(membershipsTable)
      .values([
        {
          member_id: memberId,
          membership_type_id: membershipTypeId,
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          status: 'active'
        },
        {
          member_id: memberId,
          membership_type_id: membershipTypeId,
          start_date: '2023-01-01',
          end_date: '2023-12-31',
          status: 'expired'
        }
      ])
      .execute();

    const result = await getMemberships();

    expect(result).toHaveLength(2);
    
    // Check first membership
    expect(result[0].member_id).toEqual(memberId);
    expect(result[0].membership_type_id).toEqual(membershipTypeId);
    expect(result[0].start_date).toBeInstanceOf(Date);
    expect(result[0].end_date).toBeInstanceOf(Date);
    expect(result[0].status).toEqual('active');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second membership
    expect(result[1].member_id).toEqual(memberId);
    expect(result[1].membership_type_id).toEqual(membershipTypeId);
    expect(result[1].start_date).toBeInstanceOf(Date);
    expect(result[1].end_date).toBeInstanceOf(Date);
    expect(result[1].status).toEqual('expired');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return memberships with different statuses', async () => {
    // Create test member
    const memberResults = await db.insert(membersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        join_date: '2024-01-01'
      })
      .returning()
      .execute();
    
    const memberId = memberResults[0].id;

    // Create test membership type
    const membershipTypeResults = await db.insert(membershipTypesTable)
      .values({
        name: 'Basic',
        description: 'Basic membership',
        duration_months: 6,
        price: '49.99'
      })
      .returning()
      .execute();
    
    const membershipTypeId = membershipTypeResults[0].id;

    // Create memberships with different statuses
    await db.insert(membershipsTable)
      .values([
        {
          member_id: memberId,
          membership_type_id: membershipTypeId,
          start_date: '2024-01-01',
          end_date: '2024-06-30',
          status: 'active'
        },
        {
          member_id: memberId,
          membership_type_id: membershipTypeId,
          start_date: '2023-07-01',
          end_date: '2023-12-31',
          status: 'expired'
        },
        {
          member_id: memberId,
          membership_type_id: membershipTypeId,
          start_date: '2024-07-01',
          end_date: '2024-12-31',
          status: 'cancelled'
        }
      ])
      .execute();

    const result = await getMemberships();

    expect(result).toHaveLength(3);
    
    const statuses = result.map(m => m.status);
    expect(statuses).toContain('active');
    expect(statuses).toContain('expired');
    expect(statuses).toContain('cancelled');
  });

  it('should return memberships with correct date types', async () => {
    // Create test member
    const memberResults = await db.insert(membersTable)
      .values({
        first_name: 'Test',
        last_name: 'User',
        email: 'test.user@example.com',
        join_date: '2024-01-01'
      })
      .returning()
      .execute();
    
    const memberId = memberResults[0].id;

    // Create test membership type
    const membershipTypeResults = await db.insert(membershipTypesTable)
      .values({
        name: 'Test',
        description: 'Test membership',
        duration_months: 1,
        price: '19.99'
      })
      .returning()
      .execute();
    
    const membershipTypeId = membershipTypeResults[0].id;

    const testStartDate = '2024-03-15';
    const testEndDate = '2024-04-15';

    await db.insert(membershipsTable)
      .values({
        member_id: memberId,
        membership_type_id: membershipTypeId,
        start_date: testStartDate,
        end_date: testEndDate,
        status: 'active'
      })
      .execute();

    const result = await getMemberships();

    expect(result).toHaveLength(1);
    expect(result[0].start_date).toBeInstanceOf(Date);
    expect(result[0].end_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    // Check that dates match what we inserted
    expect(result[0].start_date.getTime()).toEqual(new Date(testStartDate).getTime());
    expect(result[0].end_date.getTime()).toEqual(new Date(testEndDate).getTime());
  });
});