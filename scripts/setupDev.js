/**
 * One-time environment sanity check. Run from the project root: npm run setup
 *
 * This does NOT install dependencies or start servers — it just checks that
 * the .env files exist and required variables look plausible, so you find
 * out about a missing API key now instead of after everything else installs.
 */
const fs = require('fs');
const path = require('path');

const BACKEND_ENV = path.join(__dirname, '../backend/.env');
const BACKEND_ENV_EXAMPLE = path.join(__dirname, '../backend/.env.example');
const FRONTEND_ENV = path.join(__dirname, '../frontend/.env');
const FRONTEND_ENV_EXAMPLE = path.join(__dirname, '../frontend/.env.example');

let hasIssues = false;

function checkFile(envPath, examplePath, label) {
  if (!fs.existsSync(envPath)) {
    console.log(`✗ ${label}/.env not found.`);
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      console.log(`  → Copied ${label}/.env.example to ${label}/.env for you. Fill in real values before running.`);
    }
    hasIssues = true;
    return null;
  }
  console.log(`✓ ${label}/.env exists`);
  return fs.readFileSync(envPath, 'utf8');
}

function checkVar(content, key, placeholderValues = []) {
  const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
  const value = match ? match[1].trim() : '';

  if (!value) {
    console.log(`  ✗ ${key} is empty`);
    hasIssues = true;
    return;
  }
  if (placeholderValues.includes(value)) {
    console.log(`  ✗ ${key} is still set to the placeholder value — replace it with a real value`);
    hasIssues = true;
    return;
  }
  console.log(`  ✓ ${key} is set`);
}

console.log('Checking backend/.env ...');
const backendEnv = checkFile(BACKEND_ENV, BACKEND_ENV_EXAMPLE, 'backend');
if (backendEnv) {
  checkVar(backendEnv, 'MONGODB_URI', ['mongodb+srv://<username>:<password>@<cluster>.mongodb.net/disaster_response?retryWrites=true&w=majority']);
  checkVar(backendEnv, 'GROQ_API_KEY', ['your_groq_api_key_here']);
  checkVar(backendEnv, 'JWT_SECRET', ['replace_this_with_a_random_64_char_hex_string']);
}

console.log('\nChecking frontend/.env ...');
checkFile(FRONTEND_ENV, FRONTEND_ENV_EXAMPLE, 'frontend');

console.log('\n' + '─'.repeat(60));
if (hasIssues) {
  console.log('Some configuration is missing or still using placeholder values.');
  console.log('Fix the items marked ✗ above, then run: npm run setup   (to re-check)');
  console.log('\nWhere to get things:');
  console.log('  MONGODB_URI  → Atlas dashboard > Database > Connect > Drivers');
  console.log('  GROQ_API_KEY → https://console.groq.com/keys (free)');
  console.log('  JWT_SECRET   → node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
} else {
  console.log('Environment looks good. Next steps:');
  console.log('  1. npm run install:all');
  console.log('  2. npm run ingest:sops   (loads the SOP knowledge base + prints Atlas index setup steps)');
  console.log('  3. npm run seed          (optional demo users + sample reports)');
  console.log('  4. npm run dev           (starts backend + frontend together)');
}
console.log('─'.repeat(60));
