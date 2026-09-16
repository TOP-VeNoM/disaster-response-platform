const Report = require('../../models/Report');
const AgentAction = require('../../models/AgentAction');
const { parseReport } = require('./ReportParser');
const { classify } = require('./Classifier');
const { retrieveSOPs } = require('../rag/Retriever');
const { rerank } = require('../rag/Reranker');
const { buildSOPExcerpts } = require('../rag/PromptConstructor');
const ToolRegistry = require('../tools/ToolRegistry');
const { generatePlan } = require('./PlanGenerator');
const logger = require('../../utils/logger');

/**
 * Runs a report through the full agent pipeline:
 *   1. Parse  2. Classify  3. Retrieve SOPs  4. Call tools  5. Generate plan  6. (wait for) human review
 *
 * Every step is logged to AgentAction regardless of success/failure, so the
 * frontend's AgentTimeline component always has something to render and you
 * can see exactly where a run stalled. The pipeline never auto-executes the
 * final plan — it always stops at 'awaiting_review'.
 */
async function runPipeline(reportId) {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new Error(`AgentOrchestrator: report ${reportId} not found`);
  }

  report.status = 'processing';
  await report.save();

  try {
    // ── Step 1: Parse ──────────────────────────────────────────
    const parsed = await logStep(report._id, 'parse', report.toObject(), () =>
      Promise.resolve(parseReport(report))
    );

    // ── Step 2: Classify ───────────────────────────────────────
    const classification = await logStep(
      report._id,
      'classify',
      { description: parsed.description, disasterType: parsed.disasterType },
      () => classify(parsed)
    );
    report.urgency = classification.urgency;
    report.agentRun.classification = classification;
    await report.save();

    // ── Step 3: Retrieve SOPs ──────────────────────────────────
    const rawSOPs = await logStep(
      report._id,
      'retrieve_sops',
      { query: parsed.description, disasterType: parsed.disasterType },
      () => retrieveSOPs(parsed.description, { disasterType: parsed.disasterType, topK: 3 })
    );
    const rankedSOPs = rerank(rawSOPs, { disasterType: parsed.disasterType, queryText: parsed.description });
    report.agentRun.retrievedSOPs = rankedSOPs.map((s) => ({
      sopId: s._id,
      title: s.title,
      score: s.score
    }));
    await report.save();

    // ── Step 4: Call tools ──────────────────────────────────────
    const toolResults = await logStep(
      report._id,
      'call_tool',
      { location: parsed.location, disasterType: parsed.disasterType },
      () => gatherToolContext(parsed)
    );
    report.agentRun.toolResults = toolResults;
    await report.save();

    // ── Step 5: Generate plan ────────────────────────────────────
    const sopExcerpts = buildSOPExcerpts(rankedSOPs);
    const plan = await logStep(
      report._id,
      'generate_plan',
      { urgency: classification.urgency, sopCount: sopExcerpts.length, toolCount: toolResults.length },
      () =>
        generatePlan({
          description: parsed.description,
          disasterType: parsed.disasterType,
          urgency: classification.urgency,
          sopExcerpts,
          toolContext: toolResults
        })
    );
    report.agentRun.plan = plan;

    // ── Step 6: Await human review (does not run automatically) ──
    report.status = 'awaiting_review';
    await report.save();

    await AgentAction.create({
      report: report._id,
      step: 'human_review',
      status: 'started',
      input: { plan },
      output: null
    });

    logger.info(`AgentOrchestrator: pipeline complete for report ${reportId}, awaiting human review`);
    return report;
  } catch (err) {
    logger.error(`AgentOrchestrator: pipeline failed for report ${reportId}: ${err.message}`);
    report.status = 'submitted'; // roll back so it can be retried
    await report.save();
    throw err;
  }
}

/**
 * Calls the weather and similar-reports tools in parallel. Geocoding only
 * runs first if we don't already have lat/lng, since weather needs coordinates.
 */
async function gatherToolContext(parsed) {
  const results = [];
  let { lat, lng } = parsed.location;

  if ((lat === null || lng === null) && parsed.location.address) {
    const geoResult = await ToolRegistry.call('geocode_address', { address: parsed.location.address });
    results.push(geoResult);
    if (geoResult.output?.available) {
      lat = geoResult.output.lat;
      lng = geoResult.output.lng;
    }
  }

  const [weatherResult, similarReportsResult] = await Promise.all([
    ToolRegistry.call('get_weather', { lat, lng }),
    ToolRegistry.call('lookup_similar_reports', { disasterType: parsed.disasterType, lat, lng })
  ]);

  results.push(weatherResult, similarReportsResult);
  return results;
}

/**
 * Wraps a pipeline step with AgentAction logging (started -> completed/failed)
 * and timing, so failures in one step are visible without hiding the error
 * from the caller — the promise still rejects, but the fact that it started
 * and how it failed is always recorded first.
 */
async function logStep(reportId, step, input, fn) {
  const startedAt = Date.now();
  await AgentAction.create({ report: reportId, step, status: 'started', input });

  try {
    const output = await fn();
    await AgentAction.create({
      report: reportId,
      step,
      status: 'completed',
      input,
      output,
      durationMs: Date.now() - startedAt
    });
    return output;
  } catch (err) {
    await AgentAction.create({
      report: reportId,
      step,
      status: 'failed',
      input,
      error: err.message,
      durationMs: Date.now() - startedAt
    });
    throw err;
  }
}

module.exports = { runPipeline };
