/*
 * Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
 * This software is proprietary to ZyptAI.
 * File path: src/services/openaiService.js
 */
// One-line summary: Handles communication with Azure OpenAI services.

const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const config = require('../config/config');

/**
 * Gets a response from Azure OpenAI based on the provided prompt.
 * @param {string} prompt - The user prompt to be sent to OpenAI.
 * @returns {Promise<Object>} - The OpenAI response object.
 */
async function getOpenAIResponse(prompt) {
  const openAiClient = new OpenAIClient(config.azureOpenAiEndpoint, new AzureKeyCredential(config.azureOpenAiApiKey));
  return await openAiClient.getChatCompletions(
    config.azureOpenAiCompletionsDeployment,
    [{ role: "user", content: prompt }],
    { maxTokens: 1000, temperature: 0.5 }
  );
}

module.exports = { getOpenAIResponse };
