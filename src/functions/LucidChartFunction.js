/*
 * Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
 * This software is proprietary to ZyptAI.
 * File path: src/lucidChartFunction.js
 */
// One-line summary: Main Azure Function to generate a Lucidchart diagram using OpenAI.

const { app } = require('@azure/functions');
const { getOpenAIResponse } = require('./services/openaiService');
const { uploadFileToAzureFileShare, zipAndUploadDocument } = require('./services/azureStorageService');
const { submitToLucidApi } = require('./services/lucidApiService');
const { validateEnvironmentVariables } = require('./utils/validation');

/**
 * Main Azure Function handler for generating a Lucidchart diagram.
 * @param {Object} req - The HTTP request object.
 * @returns {Object} - The HTTP response object.
 */
async function lucidChartFunction(req) {
  console.log('LucidChartFunction triggered.');
  try {
    validateEnvironmentVariables();
    const prompt = req.body.prompt || "Explain the phases of an SAP implementation project";
    const response = await getOpenAIResponse(prompt);
    
    let generatedContent = "No response generated.";
    if (response.choices && response.choices.length > 0) {
      generatedContent = response.choices[0].message.content.trim();
    }
    
    await zipAndUploadDocument(generatedContent);
    const lucidResponse = await submitToLucidApi('/tmp/form.lucid');

    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: 'Chart created successfully.', editUrl: lucidResponse.editUrl }),
    };
  } catch (error) {
    console.error('An error occurred during function execution:', error);
    return { status: 500, body: `An error occurred: ${error.message}` };
  }
}

app.http('LucidChartFunction', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: lucidChartFunction
});

module.exports = { lucidChartFunction };
