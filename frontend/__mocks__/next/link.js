// Mock for next/link
const React = require('react');

module.exports = ({ children, href, ...props }) => {
  return React.createElement('a', { href, ...props }, children);
};
