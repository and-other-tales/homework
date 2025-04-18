// Mock implementation of Babel's interopRequireDefault helper
module.exports = function interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
};
