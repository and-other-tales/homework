// Mock implementation of Babel's inherits helper
module.exports = function inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: { value: subClass, writable: true, configurable: true }
  });
  
  if (superClass) {
    Object.setPrototypeOf 
      ? Object.setPrototypeOf(subClass, superClass) 
      : subClass.__proto__ = superClass;
  }
};
