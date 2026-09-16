/**
 * Seeds demo accounts (one per role) and a couple of sample reports so the
 * dashboard/reports list/agent queue aren't empty on first login.
 *
 * Run from the project root: npm run seed
 *
 * Safe to run multiple times — it skips creating a user if that email
 * already exists, and only adds sample reports if none exist yet.
 */
/**
 * This script uses packages (mongoose, dotenv) that are only installed in
 * backend/node_modules, not in a root-level node_modules. Adding that path
 * here means `require('mongoose')` etc. below resolve correctly no matter
 * what directory you run this script from.
 */
module.paths.push(require('path').join(__dirname, '../backend/node_modules'));

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const mongoose = require('mongoose');
const User = require('../backend/src/models/User');
const Report = require('../backend/src/models/Report');

const DEMO_USERS = [
  { name: 'Demo Reporter', email: 'reporter@demo.com', password: 'password123', role: 'reporter' },
  { name: 'Demo Responder', email: 'responder@demo.com', password: 'password123', role: 'responder' },
  { name: 'Demo Admin', email: 'admin@demo.com', password: 'password123', role: 'admin' }
];

const SAMPLE_REPORTS = [
  {
    description:
      'Water is rising fast on Elm Street near the elementary school. Several cars appear stuck and at least one family is on their porch roof waving for help.',
    disasterType: 'flood',
    location: { address: 'Elm Street near Lincoln Elementary', lat: 40.7128, lng: -74.006 }
  },
  {
    description:
      'Smoke visible from a two-story house on Baker Avenue, flames on the second floor. Neighbors say the family may still be inside.',
    disasterType: 'fire',
    location: { address: '142 Baker Avenue', lat: 40.7306, lng: -73.9866 }
  }
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Copy backend/.env.example to backend/.env and fill it in first.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log(`Connected to database: "${mongoose.connection.db.databaseName}"\n`);

  console.log('Seeding demo users...');
  const createdUsers = {};
  for (const demoUser of DEMO_USERS) {
    const existing = await User.findOne({ email: demoUser.email });
    if (existing) {
      console.log(`  - ${demoUser.email} already exists, skipping`);
      createdUsers[demoUser.role] = existing;
    } else {
      const user = await User.create(demoUser);
      console.log(`  - Created ${demoUser.role}: ${demoUser.email} / password123`);
      createdUsers[demoUser.role] = user;
    }
  }

  const existingReportCount = await Report.countDocuments();
  if (existingReportCount > 0) {
    console.log(`\nFound ${existingReportCount} existing report(s). Skipping sample report seed.`);
  } else {
    console.log(`\nSeeding sample reports, attached to reporter@demo.com (id: ${createdUsers.reporter._id})...`);
    for (const sample of SAMPLE_REPORTS) {
      await Report.create({ ...sample, reporter: createdUsers.reporter._id });
      console.log(`  - Created report: "${sample.description.slice(0, 50)}..."`);
    }
    console.log(
      '\nIMPORTANT: these reports only appear for a REPORTER-role account when you are logged in as\n' +
      'reporter@demo.com specifically — the reporter role only ever sees its OWN reports, by design\n' +
      '(see backend/src/controllers/reportController.js listReports). If you log in as a different\n' +
      'reporter account, or as responder@demo.com / admin@demo.com, you will see these too (those two\n' +
      'roles see every report), but a different reporter account will see none of these until they\n' +
      'submit their own.\n\n' +
      'Also note: these are created directly in the DB, bypassing the agent pipeline (no API call was\n' +
      'made, so Groq/OpenWeather/OpenCage were not hit and no cost was incurred). They will show as\n' +
      '"submitted" with no classification until you either resubmit through the UI or trigger a rerun\n' +
      'from the Agent Review page while logged in as a responder or admin.'
    );
  }

  console.log('\n' + '─'.repeat(70));
  console.log('Demo login credentials (all passwords: password123)');
  console.log('─'.repeat(70));
  DEMO_USERS.forEach((u) => console.log(`  ${u.role.padEnd(10)} ${u.email}`));

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
