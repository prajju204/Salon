const dns = require('dns');

// Force Node.js to prefer IPv4 DNS resolution (prevents IPv6 connection timeout on Vercel)
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore in environments where not supported
}

const app = require('../server/app');

module.exports = app;

