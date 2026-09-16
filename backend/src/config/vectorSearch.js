/**
 * Atlas Vector Search configuration.
 *
 * IMPORTANT: Atlas Vector Search indexes cannot be created through the driver —
 * they must be created once via the Atlas UI or the Atlas CLI. This file just
 * centralizes the shape/name so the rest of the app (and the ingest script)
 * agree on it. The ingest script (scripts/ingestSOPs.js) prints these exact
 * setup instructions when you run it.
 */

const VECTOR_CONFIG = {
  indexName: process.env.VECTOR_INDEX_NAME || 'sop_vector_index',
  collectionName: 'sops',
  embeddingField: 'embedding',
  // all-MiniLM-L6-v2 (used by DocumentIngestion.js via @xenova/transformers) outputs 384-dim vectors
  numDimensions: 384,
  similarity: 'cosine'
};

/**
 * The exact JSON to paste into Atlas UI -> Atlas Search -> Create Search Index
 * -> JSON Editor, when creating the vector index on the `sops` collection.
 */
function getIndexDefinitionJSON() {
  return {
    name: VECTOR_CONFIG.indexName,
    type: 'vectorSearch',
    definition: {
      fields: [
        {
          type: 'vector',
          path: VECTOR_CONFIG.embeddingField,
          numDimensions: VECTOR_CONFIG.numDimensions,
          similarity: VECTOR_CONFIG.similarity
        },
        {
          type: 'filter',
          path: 'disasterType'
        }
      ]
    }
  };
}

module.exports = { VECTOR_CONFIG, getIndexDefinitionJSON };
