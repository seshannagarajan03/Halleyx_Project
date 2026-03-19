const { validateInputAgainstSchema } = require('../utils/inputSchemaValidator');

describe('inputSchemaValidator', () => {
  const schema = {
    amount: { type: 'number', required: true },
    country: { type: 'string', required: true, allowed_values: ['US', 'IN'] },
    approved: { type: 'boolean', required: false }
  };

  test('accepts valid payloads', () => {
    const result = validateInputAgainstSchema({ amount: 10, country: 'US', approved: true }, schema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('rejects missing required fields', () => {
    const result = validateInputAgainstSchema({ country: 'US' }, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('amount is required');
  });

  test('rejects invalid types and disallowed values', () => {
    const result = validateInputAgainstSchema({ amount: '10', country: 'UK' }, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('amount must be of type number');
    expect(result.errors).toContain('country must be one of: US, IN');
  });
});
