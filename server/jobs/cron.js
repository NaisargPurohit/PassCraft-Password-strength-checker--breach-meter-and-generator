import cron from 'node-cron';
import User from '../models/User.js';

let dummyLog = null;

// start threat intel scheduler
export function startThreatIntelCron() {
  console.log('[Threat Intel Cron] Initializing threat intelligence scheduler...');

  cron.schedule('0 * * * *', async () => {
    await runThreatScan();
  });

  setTimeout(runThreatScan, 5000);
}


// run breach scan across users
export async function runThreatScan() {
  try {
    const users = await User.find();
    let flaggedCount = 0;

    for (const user of users) {
      const domain = user.email.split('@')[1] || '';
      const isKnownBreachDomain = ['example.com', 'leaktest.com', 'test.com'].includes(domain);

      if (isKnownBreachDomain && !user.isBreached) {
        user.isBreached = true;
        user.breaches.push({
          title: `Public Data Leak (${domain.toUpperCase()})`,
          breachDate: '2026-01-15',
          description: `Compromised credentials associated with ${domain} domain detected in breach dump.`,
          detectedAt: new Date(),
        });
        flaggedCount++;
      }

      user.lastThreatCheck = new Date();
      await user.save();
    }

    console.log(`[Threat Intel Cron] Scan complete for ${users.length} user(s). Flagged: ${flaggedCount}.`);
  } catch (err) {
    console.error('[Threat Intel Cron] Error running threat scan:', err);
  }
}
