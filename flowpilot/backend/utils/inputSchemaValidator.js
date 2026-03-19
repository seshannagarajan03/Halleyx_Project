const validateType = (value, type) => {
  if (value === null || value === undefined) return true;

  switch (type) {
    case 'number':
      return typeof value === 'number' && !Number.isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'string':
    default:
      return typeof value === 'string';
  }
};

const validateInputAgainstSchema = (inputData = {}, inputSchema = {}) => {
  const errors = [];

  for (const [fieldName, config] of Object.entries(inputSchema || {})) {
    const value = inputData[fieldName];

    if (config.required && (value === '' || value === null || value === undefined)) {
      errors.push(`${fieldName} is required`);
      continue;
    }

    if (!validateType(value, config.type)) {
      errors.push(`${fieldName} must be of type ${config.type}`);
      continue;
    }

    if (
      Array.isArray(config.allowed_values) &&
      config.allowed_values.length > 0 &&
      value !== '' &&
      value !== null &&
      value !== undefined &&
      !config.allowed_values.includes(value)
    ) {
      errors.push(`${fieldName} must be one of: ${config.allowed_values.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateInputAgainstSchema
};
