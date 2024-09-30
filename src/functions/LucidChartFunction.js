// File: src/functions/LucidChartFunction.js
// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.

// Main Azure Function for generating Lucid charts for SAP implementation processes

const { app } = require('@azure/functions');
const openAIService = require('../services/openAIService');
const { performHybridSearch } = require('../services/searchService');
const { generateLucidChartData } = require('../services/lucidChartGenerator');
const { generateChartStructureDescription } = require('../services/chartStructureGenerator');
const { processLucidChartFile } = require('../services/fileOperations');
const { submitToLucidApi } = require('../services/lucidApiService');

/**
 * Azure Function to handle the Lucid chart generation process using RAG pipeline
 * @param {Object} request - The HTTP request object
 * @param {Object} context - The Azure Functions context object
 * @returns {Object} HTTP response object with status and body
 */
const lucidChartFunction = async function(request, context) {
    context.log('LucidChartFunction triggered.');

    try {
        const body = await readRequestBody(request);
        context.log('Parsed request body:', JSON.stringify(body).substring(0, 50));

        // Ensure the request body exists and has a prompt
        if (!body || !body.prompt) {
            throw new Error("Missing 'prompt' in the request body");
        }

        const userPrompt = body.prompt;
        context.log(`Received prompt: ${userPrompt.substring(0, 50)}`);

        // Step 1: Generate embeddings for the user prompt
        context.log('Generating embeddings...');
        const embedding = await openAIService.generateEmbeddings(userPrompt);
        context.log('Embeddings generated successfully.');

        // Step 2: Perform hybrid search
        context.log('Performing hybrid search...');
        const searchResults = await performHybridSearch(userPrompt, embedding);
        context.log('Hybrid search completed.');

        // Step 3: Generate chart structure description
        context.log('Generating chart structure description...');
        const processDescription = await generateChartStructureDescription(userPrompt, searchResults);
        context.log('Chart structure description generated.');
        context.log('Process Description:', processDescription);

        // Step 4: Generate Lucid chart data
        context.log('Generating Lucid chart data...');
        const chartData = await generateLucidChartData(processDescription);
        context.log('Lucid chart data generated successfully.');

        // Step 5: Process and upload Lucid chart file
        context.log('Processing Lucid chart file...');
        const lucidFilePath = await processLucidChartFile(chartData);
        context.log('Lucid chart file processed and uploaded successfully.');

        // Step 6: Submit to Lucid API
        context.log('Submitting to Lucid API...');
        const lucidResponse = await submitToLucidApi(lucidFilePath);
        context.log('Submission to Lucid API successful.');

        // Prepare response
        const responseMessage = {
            status: 'Chart created successfully.',
            editUrl: lucidResponse.editUrl,
            viewUrl: lucidResponse.viewUrl,
            sourceDocument: searchResults.filename,
            sourceUrl: searchResults.fileUrl
        };

        context.log('Function execution completed successfully.');
        return { body: JSON.stringify(responseMessage) };

    } catch (error) {
        context.log(`An error occurred during function execution: ${error.message}`);
        context.log('Error stack trace:', error.stack);
        return {
            status: 500,
            body: JSON.stringify({ 
                error: `An error occurred: ${error.message}`,
                stack: error.stack
            })
        };
    }
};

/**
 * Reads and parses the request body from a ReadableStream
 * @param {Object} request - The HTTP request object
 * @returns {Promise<Object>} Parsed request body
 */
async function readRequestBody(request) {
    const reader = request.body.getReader();
    let result = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += new TextDecoder().decode(value);
    }
    try {
        return JSON.parse(result);
    } catch (error) {
        throw new Error(`Failed to parse request body as JSON: ${error.message}`);
    }
}

app.http('LucidChartFunction', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: lucidChartFunction
});

module.exports = { lucidChartFunction };