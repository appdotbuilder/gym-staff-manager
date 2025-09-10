import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { membershipTypesTable } from '../db/schema';
import { type CreateMembershipTypeInput } from '../schema';
import { getMembershipTypes } from '../handlers/get_membership_types';

describe('getMembershipTypes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no membership types exist', async () => {
    const result = await getMembershipTypes();
    expect(result).toEqual([]);
  });

  it('should return all membership types', async () => {
    // Create test membership types
    const testMembershipTypes = [
      {
        name: 'Basic Monthly',
        description: 'Basic gym access for one month',
        duration_months: 1,
        price: '29.99',
        is_active: true
      },
      {
        name: 'Premium Annual',
        description: 'Full access with personal training',
        duration_months: 12,
        price: '299.99',
        is_active: true
      },
      {
        name: 'Legacy Plan',
        description: 'Old membership plan',
        duration_months: 6,
        price: '150.00',
        is_active: false
      }
    ];

    await db.insert(membershipTypesTable)
      .values(testMembershipTypes)
      .execute();

    const result = await getMembershipTypes();

    expect(result).toHaveLength(3);

    // Verify first membership type
    const basicMonthly = result.find(mt => mt.name === 'Basic Monthly');
    expect(basicMonthly).toBeDefined();
    expect(basicMonthly!.description).toEqual('Basic gym access for one month');
    expect(basicMonthly!.duration_months).toEqual(1);
    expect(basicMonthly!.price).toEqual(29.99);
    expect(typeof basicMonthly!.price).toEqual('number');
    expect(basicMonthly!.is_active).toEqual(true);
    expect(basicMonthly!.id).toBeDefined();
    expect(basicMonthly!.created_at).toBeInstanceOf(Date);

    // Verify premium annual membership type
    const premiumAnnual = result.find(mt => mt.name === 'Premium Annual');
    expect(premiumAnnual).toBeDefined();
    expect(premiumAnnual!.price).toEqual(299.99);
    expect(typeof premiumAnnual!.price).toEqual('number');
    expect(premiumAnnual!.duration_months).toEqual(12);

    // Verify inactive membership type is also returned
    const legacyPlan = result.find(mt => mt.name === 'Legacy Plan');
    expect(legacyPlan).toBeDefined();
    expect(legacyPlan!.is_active).toEqual(false);
    expect(legacyPlan!.price).toEqual(150.00);
    expect(typeof legacyPlan!.price).toEqual('number');
  });

  it('should handle membership types with null descriptions', async () => {
    // Create membership type with null description
    await db.insert(membershipTypesTable)
      .values({
        name: 'Student Discount',
        description: null,
        duration_months: 1,
        price: '19.99',
        is_active: true
      })
      .execute();

    const result = await getMembershipTypes();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Student Discount');
    expect(result[0].description).toBeNull();
    expect(result[0].price).toEqual(19.99);
    expect(typeof result[0].price).toEqual('number');
  });

  it('should handle various price formats correctly', async () => {
    // Create membership types with different price formats
    const testMembershipTypes = [
      {
        name: 'Whole Number',
        description: null,
        duration_months: 1,
        price: '50',
        is_active: true
      },
      {
        name: 'Two Decimals',
        description: null,
        duration_months: 1,
        price: '49.99',
        is_active: true
      },
      {
        name: 'One Decimal',
        description: null,
        duration_months: 1,
        price: '45.5',
        is_active: true
      }
    ];

    await db.insert(membershipTypesTable)
      .values(testMembershipTypes)
      .execute();

    const result = await getMembershipTypes();

    expect(result).toHaveLength(3);

    const wholeNumber = result.find(mt => mt.name === 'Whole Number');
    expect(wholeNumber!.price).toEqual(50);
    expect(typeof wholeNumber!.price).toEqual('number');

    const twoDecimals = result.find(mt => mt.name === 'Two Decimals');
    expect(twoDecimals!.price).toEqual(49.99);
    expect(typeof twoDecimals!.price).toEqual('number');

    const oneDecimal = result.find(mt => mt.name === 'One Decimal');
    expect(oneDecimal!.price).toEqual(45.5);
    expect(typeof oneDecimal!.price).toEqual('number');
  });

  it('should return membership types ordered by insertion order', async () => {
    // Create membership types in specific order
    await db.insert(membershipTypesTable)
      .values({
        name: 'First',
        description: null,
        duration_months: 1,
        price: '10.00',
        is_active: true
      })
      .execute();

    await db.insert(membershipTypesTable)
      .values({
        name: 'Second',
        description: null,
        duration_months: 2,
        price: '20.00',
        is_active: true
      })
      .execute();

    await db.insert(membershipTypesTable)
      .values({
        name: 'Third',
        description: null,
        duration_months: 3,
        price: '30.00',
        is_active: true
      })
      .execute();

    const result = await getMembershipTypes();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('First');
    expect(result[1].name).toEqual('Second');
    expect(result[2].name).toEqual('Third');
  });
});