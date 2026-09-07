const dns = require('dns');

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore
}

const app = require('../server/app');

module.exports = app;

