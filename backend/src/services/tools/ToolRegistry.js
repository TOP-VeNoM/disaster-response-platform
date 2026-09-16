const WeatherTool = require('./WeatherTool');
const GeocodingTool = require('./GeocodingTool');
const DatabaseLookupTool = require('./DatabaseLookupTool');
const logger = require('../../utils/logger');

const tools = new Map();

function register(tool) {
  if (!tool.name || typeof tool.run !== 'function') {
    throw new Error('Tool must have a name and a run() function');
  }
  tools.set(tool.name, tool);
}

function get(name) {
  return tools.get(name);
}

function list() {
  return Array.from(tools.values()).map(({ name, description }) => ({ name, description }));
}

/**
 * Runs a tool by name with the given input. Never throws — a tool failure
 * (missing API key, network error, bad input) is captured and returned as a
 * structured result so a single failed tool doesn't crash the agent run.
 */
async function call(name, input) {
  const tool = get(name);
  if (!tool) {
    logger.warn(`ToolRegistry: unknown tool "${name}" requested`);
    return { tool: name, input, output: null, error: `Unknown tool: ${name}` };
  }

  try {
    const output = await tool.run(input);
    return { tool: name, input, output, error: null };
  } catch (err) {
    logger.error(`ToolRegistry: tool "${name}" threw: ${err.message}`);
    return { tool: name, input, output: null, error: err.message };
  }
}

// Register built-in tools at module load time
register(WeatherTool);
register(GeocodingTool);
register(DatabaseLookupTool);

module.exports = { register, get, list, call };
