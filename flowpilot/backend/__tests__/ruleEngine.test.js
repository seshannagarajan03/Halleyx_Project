const ruleEngine = require('../engine/ruleEngine');

describe('ruleEngine', () => {
  test('evaluates numeric comparisons', () => {
    expect(ruleEngine.evaluate('amount > 100', { amount: 150 })).toBe(true);
    expect(ruleEngine.evaluate('amount <= 100', { amount: 150 })).toBe(false);
  });

  test('evaluates logical expressions', () => {
    const data = { amount: 150, country: 'US', priority: 'High' };
    expect(ruleEngine.evaluate("amount > 100 && country == 'US'", data)).toBe(true);
    expect(ruleEngine.evaluate("amount > 100 && country == 'IN'", data)).toBe(false);
    expect(ruleEngine.evaluate("priority == 'Low' || country == 'US'", data)).toBe(true);
  });

  test('evaluates string helper functions', () => {
    const data = { department: 'Engineering', email: 'admin@flowpilot.app' };
    expect(ruleEngine.evaluate("contains(department, 'gin')", data)).toBe(true);
    expect(ruleEngine.evaluate("startsWith(email, 'admin')", data)).toBe(true);
    expect(ruleEngine.evaluate("endsWith(email, '.com')", data)).toBe(false);
  });

  test('validates supported conditions', () => {
    expect(ruleEngine.validate("amount > 100 && country == 'US'").isValid).toBe(true);
    expect(ruleEngine.validate('DEFAULT').isValid).toBe(true);
    expect(ruleEngine.validate('amount >>> 100').isValid).toBe(false);
    expect(ruleEngine.validate('(amount > 100').isValid).toBe(false);
  });
});
