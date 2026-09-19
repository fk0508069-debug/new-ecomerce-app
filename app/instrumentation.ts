// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const dns = require('dns');
    // Force Node.js to use Google and Cloudflare DNS instead of the broken 127.0.0.1
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
}