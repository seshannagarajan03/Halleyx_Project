class RuleEngine {
  validate(condition) {
    const trimmed = String(condition || '').trim();

    if (!trimmed) {
      return { isValid: false, message: 'Rule condition cannot be empty' };
    }

    if (trimmed.toUpperCase() === 'DEFAULT') {
      return { isValid: true };
    }

    const balanced = [...trimmed].reduce((acc, char) => {
      if (acc < 0) return acc;
      if (char === '(') return acc + 1;
      if (char === ')') return acc - 1;
      return acc;
    }, 0);

    if (balanced !== 0) {
      return { isValid: false, message: 'Rule condition has unbalanced parentheses' };
    }

    if (/(===|!==|>>>|<<<)/.test(trimmed)) {
      return { isValid: false, message: 'Rule condition uses unsupported operators' };
    }

    const atomicPatterns = [
      /^([\w.]+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/,
      /^(contains|startsWith|endsWith)\(([^,]+),\s*(['"].*['"])\)$/
    ];

    const isComposable = trimmed
      .replace(/\(([^()]+)\)/g, '$1')
      .split(/&&|\|\|/)
      .map((part) => part.trim())
      .every((part) => atomicPatterns.some((pattern) => pattern.test(part)));

    if (!isComposable) {
      return { isValid: false, message: 'Rule condition syntax is invalid' };
    }

    return { isValid: true };
  }

  evaluate(condition, data) {
    try {
      if (!condition || condition.trim() === '' || condition.trim().toUpperCase() === 'DEFAULT') return true;

      const normalized = condition.trim();
      const orParts = this.splitByOperator(normalized, '||');
      if (orParts.length > 1) {
        return orParts.some((part) => this.evaluate(part, data));
      }

      const andParts = this.splitByOperator(normalized, '&&');
      if (andParts.length > 1) {
        return andParts.every((part) => this.evaluate(part, data));
      }

      return this.evaluateAtomic(normalized, data);
    } catch (error) {
      return false;
    }
  }

  splitByOperator(expression, operator) {
    const parts = [];
    let depth = 0;
    let current = '';

    for (let i = 0; i < expression.length; i += 1) {
      const char = expression[i];
      const next = expression.slice(i, i + operator.length);

      if (char === '(') depth += 1;
      if (char === ')') depth -= 1;

      if (depth === 0 && next === operator) {
        parts.push(current.trim());
        current = '';
        i += operator.length - 1;
        continue;
      }

      current += char;
    }

    if (current.trim()) parts.push(current.trim());
    return parts;
  }

  evaluateAtomic(expression, data) {
    const trimmed = expression.trim();

    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      return this.evaluate(trimmed.slice(1, -1), data);
    }

    const fnMatch = trimmed.match(/^(contains|startsWith|endsWith)\(([^,]+),\s*(['"].*['"])\)$/);
    if (fnMatch) {
      const [, fnName, fieldPath, rawValue] = fnMatch;
      const fieldValue = this.resolveValue(fieldPath.trim(), data);
      const compareValue = this.stripQuotes(rawValue);

      switch (fnName) {
        case 'contains':
          return String(fieldValue ?? '').includes(compareValue);
        case 'startsWith':
          return String(fieldValue ?? '').startsWith(compareValue);
        case 'endsWith':
          return String(fieldValue ?? '').endsWith(compareValue);
        default:
          return false;
      }
    }

    const comparisonMatch = trimmed.match(/^([\w.]+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
    if (!comparisonMatch) {
      return false;
    }

    const [, leftPath, operator, rawRight] = comparisonMatch;
    const leftValue = this.resolveValue(leftPath, data);
    const rightValue = this.parseLiteral(rawRight.trim());

    const leftComparable = this.normalizeComparable(leftValue);
    const rightComparable = this.normalizeComparable(rightValue);

    switch (operator) {
      case '==': return leftComparable == rightComparable;
      case '!=': return leftComparable != rightComparable;
      case '>': return Number(leftComparable) > Number(rightComparable);
      case '<': return Number(leftComparable) < Number(rightComparable);
      case '>=': return Number(leftComparable) >= Number(rightComparable);
      case '<=': return Number(leftComparable) <= Number(rightComparable);
      default: return false;
    }
  }

  stripQuotes(value) {
    return value.replace(/^['"]|['"]$/g, '');
  }

  parseLiteral(value) {
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      return this.stripQuotes(value);
    }
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (!Number.isNaN(Number(value)) && value !== '') return Number(value);
    return value;
  }

  normalizeComparable(value) {
    if (typeof value === 'string' && value !== '' && !Number.isNaN(Number(value))) {
      return Number(value);
    }
    return value;
  }

  resolveValue(path, data) {
    return path.split('.').reduce((obj, key) => (obj != null ? obj[key] : undefined), data);
  }
}

module.exports = new RuleEngine();
