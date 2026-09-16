const SOP = require('../models/SOP');
const { prepareSOPsForIngestion } = require('../services/rag/DocumentIngestion');
const { retrieveSOPs } = require('../services/rag/Retriever');
const { ValidationError, NotFoundError } = require('../utils/errors');

async function listSOPs(req, res, next) {
  try {
    const { disasterType } = req.query;
    const query = disasterType ? { disasterType } : {};
    const sops = await SOP.find(query).select('-embedding').sort({ title: 1 });
    res.json({ sops });
  } catch (err) {
    next(err);
  }
}

async function getSOP(req, res, next) {
  try {
    const sop = await SOP.findById(req.params.id).select('-embedding');
    if (!sop) throw new NotFoundError('SOP');
    res.json({ sop });
  } catch (err) {
    next(err);
  }
}

async function createSOP(req, res, next) {
  try {
    const { title, disasterType, content, steps } = req.body;
    if (!title || !disasterType || !content) {
      throw new ValidationError('title, disasterType, and content are required');
    }

    const [prepared] = await prepareSOPsForIngestion([{ title, disasterType, content, steps: steps || [], source: 'manual' }]);
    const sop = await SOP.create(prepared);

    const { embedding, ...safeSOP } = sop.toObject();
    res.status(201).json({ sop: safeSOP });
  } catch (err) {
    next(err);
  }
}

async function deleteSOP(req, res, next) {
  try {
    const sop = await SOP.findByIdAndDelete(req.params.id);
    if (!sop) throw new NotFoundError('SOP');
    res.json({ message: 'SOP deleted' });
  } catch (err) {
    next(err);
  }
}

/**
 * Re-embeds unconditionally on every update, even if only `steps` changed.
 * The embedding is derived from title+content; if we tried to skip
 * re-embedding based on which fields the request touched, a future edit
 * that only *looks* like a steps-only change (but actually included a
 * trivial title/content edit) could silently leave a stale vector in place.
 * Re-embedding is cheap (local model, no API cost) so there's no real
 * reason to optimize this away.
 */
async function updateSOP(req, res, next) {
  try {
    const { title, disasterType, content, steps } = req.body;
    if (!title || !disasterType || !content) {
      throw new ValidationError('title, disasterType, and content are required');
    }

    const existing = await SOP.findById(req.params.id);
    if (!existing) throw new NotFoundError('SOP');

    const [prepared] = await prepareSOPsForIngestion([
      { title, disasterType, content, steps: steps || [], source: existing.source }
    ]);

    existing.set({
      title: prepared.title,
      disasterType: prepared.disasterType,
      content: prepared.content,
      steps: prepared.steps,
      embedding: prepared.embedding
    });
    await existing.save();

    const { embedding, ...safeSOP } = existing.toObject();
    res.json({ sop: safeSOP });
  } catch (err) {
    next(err);
  }
}

/**
 * Lets you manually test retrieval quality from the frontend/Postman without
 * having to submit a full report — handy while tuning the SOP corpus.
 */
async function testRetrieval(req, res, next) {
  try {
    const { query, disasterType, topK } = req.body;
    if (!query) throw new ValidationError('query is required');

    const results = await retrieveSOPs(query, { disasterType, topK: topK || 3 });
    res.json({ results });
  } catch (err) {
    next(err);
  }
}

module.exports = { listSOPs, getSOP, createSOP, updateSOP, deleteSOP, testRetrieval };
