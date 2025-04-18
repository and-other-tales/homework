// Mock implementation of Babel's objectWithoutProperties helper
const objectWithoutPropertiesLoose = require('./objectWithoutPropertiesLoose');

module.exports = function objectWithoutProperties(source, excluded) {
  return objectWithoutPropertiesLoose(source, excluded);
};
