/**
 * Loads a starter corpus of Standard Operating Procedures into MongoDB,
 * embedding each one locally (all-MiniLM-L6-v2 via @xenova/transformers)
 * so Atlas Vector Search has something to retrieve against.
 *
 * Run from the project root: npm run ingest:sops
 *
 * IMPORTANT: This script does NOT create the Atlas Vector Search index —
 * that can only be done via the Atlas UI or CLI, not the driver. This script
 * prints the exact JSON to paste into Atlas after it finishes loading data.
 * Retrieval will silently fall back to keyword search until you create it.
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
const SOP = require('../backend/src/models/SOP');
const { prepareSOPsForIngestion } = require('../backend/src/services/rag/DocumentIngestion');
const { getIndexDefinitionJSON, VECTOR_CONFIG } = require('../backend/src/config/vectorSearch');

const SAMPLE_SOPS = [
  {
    title: 'Flash Flood Emergency Response',
    disasterType: 'flood',
    content:
      'When a flash flood report is received, first confirm the affected area is not already under an active evacuation order. Dispatch responders to identify stranded individuals, prioritizing locations near schools, hospitals, and elder care facilities. Do not allow vehicles to attempt crossing flooded roads regardless of apparent depth — six inches of moving water can knock over an adult, and twelve inches can float a car. Coordinate with local fire/rescue for swift-water rescue teams if water is moving. Set up sandbag barriers at critical infrastructure points if time allows before water peaks. Issue a boil-water advisory if the flood may have compromised water treatment infrastructure.',
    steps: [
      'Confirm no active evacuation order conflicts with response plan',
      'Dispatch responders to high-priority locations (schools, hospitals, elder care)',
      'Block vehicle access to flooded roads',
      'Request swift-water rescue teams if water is moving',
      'Deploy sandbags at critical infrastructure if time permits',
      'Issue boil-water advisory if water treatment may be compromised'
    ]
  },
  {
    title: 'Residential Structure Fire Protocol',
    disasterType: 'fire',
    content:
      'Upon receiving a structure fire report, immediately verify all occupants are accounted for and evacuated — this takes priority over property protection. Establish a perimeter at minimum 100 feet from the structure to account for potential collapse or explosion risk (especially if gas lines are present). Check wind direction and speed to anticipate fire spread to neighboring structures; pre-emptively wet down adjacent roofs if wind is pushing embers that direction. Do not allow anyone to re-enter a burning structure for possessions or pets under any circumstances. Coordinate with utility companies to shut off gas and electric service to the affected structure remotely if possible.',
    steps: [
      'Verify all occupants evacuated before addressing property',
      'Establish 100+ foot perimeter, wider if gas lines present',
      'Assess wind direction for fire spread risk to neighbors',
      'Wet down adjacent structures if embers are being carried by wind',
      'Prohibit re-entry for possessions or pets',
      'Coordinate utility shutoff for gas and electric'
    ]
  },
  {
    title: 'Post-Earthquake Structural Assessment',
    disasterType: 'earthquake',
    content:
      'After an earthquake report, do not enter any structure showing visible cracks in load-bearing walls, tilted framing, or partial collapse until a structural engineer or trained assessor has cleared it. Prioritize checking on individuals in older, unreinforced masonry buildings, as these fail more often than modern code-compliant structures. Watch for aftershocks for at least 24-72 hours; treat any previously-cleared structure as unsafe again after a significant aftershock. Check gas lines for leaks (smell, hissing sound) before allowing anyone to use electrical switches, which can spark ignition. Set up a triage point away from structures for anyone with injuries.',
    steps: [
      'Do not enter structures with visible structural damage without engineer clearance',
      'Prioritize checks on unreinforced masonry buildings',
      'Monitor for aftershocks for 24-72 hours; re-assess cleared structures after significant aftershocks',
      'Check for gas leaks before permitting any electrical switch use',
      'Establish injury triage point away from all structures'
    ]
  },
  {
    title: 'Severe Storm and High Wind Response',
    disasterType: 'storm',
    content:
      'For severe storm reports involving high winds, downed trees, or downed power lines, treat all downed power lines as energized regardless of appearance — do not approach within 35 feet. Dispatch utility crews before allowing debris removal in the vicinity of any downed line. Check for structural damage to roofs and windows that could pose a falling-debris hazard to pedestrians. If hail damage is reported, advise residents to document damage with photos before any repairs for insurance purposes, but this is secondary to life-safety response. Coordinate with local shelters if extended power outages are expected in extreme temperature conditions.',
    steps: [
      'Treat all downed power lines as energized; maintain 35+ foot distance',
      'Dispatch utility crews before debris removal near downed lines',
      'Assess roofs and windows for falling-debris hazards',
      'Advise photo documentation of hail damage for insurance (secondary priority)',
      'Coordinate shelter access if extended outages coincide with extreme temperatures'
    ]
  },
  {
    title: 'Mass Casualty Medical Triage',
    disasterType: 'medical',
    content:
      'When a medical emergency report indicates multiple casualties, apply START (Simple Triage and Rapid Treatment) triage: assess ability to walk, respiratory status, perfusion, and mental status to categorize patients as immediate, delayed, minor, or deceased. Immediate-category patients (those with life-threatening but treatable conditions) get resources first. Do not spend extended time on any single patient during initial triage — the goal is rapid categorization, with detailed treatment following. Establish a clear casualty collection point separate from the hazard zone. Coordinate with the nearest trauma center to confirm bed availability before mass transport.',
    steps: [
      'Apply START triage: walking ability, respiration, perfusion, mental status',
      'Categorize patients: immediate, delayed, minor, deceased',
      'Prioritize immediate-category patients for first resource allocation',
      'Avoid extended time per patient during initial triage pass',
      'Establish casualty collection point away from hazard zone',
      'Confirm trauma center bed availability before mass transport'
    ]
  },
  {
    title: 'General Unclassified Emergency Intake',
    disasterType: 'other',
    content:
      'For reports that do not clearly fit flood, fire, earthquake, storm, or medical categories, gather as much specific detail as possible before dispatching: exact location, number of people affected, whether the situation is escalating, and whether any immediate life-safety threat exists. If genuinely ambiguous, err toward treating it as higher urgency until a responder can assess in person — false alarms are a much lower cost than a delayed response to a real emergency. Route to the most relevant specialist team once more information is available.',
    steps: [
      'Gather specific location, headcount, and escalation status',
      'Determine if immediate life-safety threat is present',
      'Default to higher urgency when genuinely ambiguous',
      'Route to specialist team once category becomes clear'
    ]
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

  const existingCount = await SOP.countDocuments();
  if (existingCount > 0) {
    console.log(`Found ${existingCount} existing SOP(s). Skipping seed to avoid duplicates.`);
    console.log('To re-seed from scratch, manually drop the "sops" collection first.\n');
  } else {
    console.log(`Embedding and inserting ${SAMPLE_SOPS.length} sample SOPs...`);
    console.log('(First run downloads the local embedding model, ~90MB — this may take a minute.)\n');

    const prepared = await prepareSOPsForIngestion(SAMPLE_SOPS);
    await SOP.insertMany(prepared);
    console.log(`Inserted ${prepared.length} SOPs with embeddings.\n`);
  }

  console.log('─'.repeat(70));
  console.log('NEXT STEP: Create the Atlas Vector Search index (one-time, manual)');
  console.log('─'.repeat(70));
  console.log(`
This CANNOT be done via script — MongoDB Atlas requires vector indexes to be
created through the Atlas UI or Atlas CLI, not the driver. Do this now:

  1. Go to https://cloud.mongodb.com and open your cluster.
  2. Click the "Atlas Search" tab (or "Search" in the left sidebar).
  3. Click "Create Search Index".
  4. Choose "JSON Editor" (not the visual builder).
  5. Select the database you're using and the "${VECTOR_CONFIG.collectionName}" collection.
  6. Paste this exact JSON:

${JSON.stringify(getIndexDefinitionJSON(), null, 2)}

  7. Click "Create Search Index" and wait ~1-2 minutes for it to build
     (status will show "Active" when ready).

Until this index exists, the app still works — Retriever.js automatically
falls back to a keyword search so you're not blocked — but you won't get
real semantic vector search results until the index is built.
`);

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error('Ingestion failed:', err.message);
  process.exit(1);
});
