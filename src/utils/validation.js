/*
 * Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
 * This software is proprietary to ZyptAI.
 * File path: src/utils/validation.js
 */
// One-line summary: Validation functions for environment variables.

const config = require('../config/config');

/**
 * Validates that all required environment variables are set.
 * @throws {Error} - If any environment variables are missing.
 */
function validateEnvironmentVariables() {
  const missingVars = [];
  if (!config.azureOpenAiEndpoint) missingVars.push('AZURE_OPENAI_ENDPOINT');
  if (!config.azureOpenAiCompletionsDeployment) missingVars.push('AZURE_OPENAI_COMPLETIONS_DEPLOYMENT');
  if (!config.azureOpenAiApiKey) missingVars.push('AZURE_OPENAI_API_KEY');
  if (!config.azureFileConnectionString) missingVars.push('AZURE_STORAGE_CONNECTION_STRING');
  if (!config.lucidApiKey) missingVars.push('LUCID_API_KEY');
  if (!config.lucidUser) missingVars.push('LUCID_USER');

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}   

module.exports = { validateEnvironmentVariables };
