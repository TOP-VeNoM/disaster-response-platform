const mongoose = require('mongoose');
const SOP = require('../../models/SOP');
const { embedText } = require('./DocumentIngestion');
const { VECTOR_CONFIG } = require('../../config/vectorSearch');
const logger = require('../../utils/logger');

/**
 * Embeds the query text and runs an Atlas $vectorSearch aggregation against
 * the sops collection. Requires the vector index (see config/vectorSearch.js
 * and scripts/ingestSOPs.js for setup instructions) to already exist in Atlas.
 *
 * Falls back to a plain text/regex search if the vector index isn't ready yet
 * or the aggregation fails, so the agent pipeline doesn't hard-fail during
 * initial setup before you've created the Atlas index.
 */
async function retrieveSOPs(queryText, { disasterType, topK = 3 } = {}) {
  try {
    const queryVector = await embedText(queryText);

    const pipeline = [
      {
        $vectorSearch: {
          index: VECTOR_CONFIG.indexName,
          path: VECTOR_CONFIG.embeddingField,
          queryVector,
          numCandidates: Math.max(topK * 10, 50),
          limit: topK,
          ...(disasterType ? { filter: { disasterType: { $eq: disasterType } } } : {})
        }
      },
      {
        $project: {
          title: 1,
          disasterType: 1,
          content: 1,
          steps: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ];

    const results = await SOP.aggregate(pipeline);

    if (results.length > 0) {
      return results;
    }

    logger.warn('Vector search returned 0 results — falling back to keyword search');
    return await keywordFallbackSearch(queryText, disasterType, topK);
  } catch (err) {
    logger.error(
      `Vector search failed (${err.message}). This usually means the Atlas Vector Search index ` +
      `"${VECTOR_CONFIG.indexName}" hasn't been created yet — see scripts/ingestSOPs.js output for ` +
      'setup instructions. Falling back to keyword search.'
    );
    return await keywordFallbackSearch(queryText, disasterType, topK);
  }
}

/**
 * Simple regex-based fallback so the app still returns *something* useful
 * before the Atlas index exists, or if it's still building.
 */
async function keywordFallbackSearch(queryText, disasterType, topK) {
  const words = queryText.split(/\s+/).filter((w) => w.length > 3).slice(0, 5);
  const regex = new RegExp(words.join('|'), 'i');

  const query = { $or: [{ title: regex }, { content: regex }] };
  if (disasterType) query.disasterType = disasterType;

  const results = await SOP.find(query).limit(topK).select('title disasterType content steps').lean();
  return results.map((r) => ({ ...r, score: null }));
}

module.exports = { retrieveSOPs };
