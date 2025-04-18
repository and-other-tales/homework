// Mock for next/image
const React = require('react');

module.exports = ({ src, alt, ...props }) => {
  return React.createElement('img', { src, alt, ...props });
};
