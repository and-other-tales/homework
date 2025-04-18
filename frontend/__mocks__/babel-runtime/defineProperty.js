// Mock implementation of Babel's defineProperty helper
module.exports = function defineProperty(obj, key, value) {
  obj[key] = value;
  return obj;
};
