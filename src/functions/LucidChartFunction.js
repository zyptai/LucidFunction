// File: src/functions/LucidChartFunction.js
// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.

// Main Azure Function for generating Lucid charts for SAP implementation processes

const { app } = require('@azure/functions');
const { generateEmbeddings, callAzureOpenAI } = require('../services/openAIService');
const { performHybridSearch } = require('../services/searchService');
const { generateLucidChartData } = require('../services/lucidChartGenerator');
const { uploadToAzureFileShare, zipAndRename, submitToLucidApi } = require('../services/fileOperations');

/**
 * Azure Function to handle the Lucid chart generation process using RAG pipeline
 * @param {Object} req - The HTTP request object
 * @returns {Object} HTTP response object with status and body
 */
async function lucidChartFunction(req) {
    console.log('LucidChartFunction triggered.');

    try {
        const userPrompt = req.body.prompt || "Explain the phases of an SAP implementation project";
        console.log(`Received prompt: ${userPrompt}`);

        // Generate embeddings for the user prompt
        console.log('Generating embeddings...');
        const embedding = await generateEmbeddings(userPrompt);

        // Perform hybrid search
        console.log('Performing hybrid search...');
        const searchResults = await performHybridSearch(userPrompt, embedding);

        // Prepare messages for OpenAI
        const messages = [
            { role: "system", content: "You are an AI assistant tasked with creating a Lucid chart for SAP implementation processes." },
            { role: "user", content: userPrompt },
            { role: "assistant", content: `Here are some relevant documents: ${searchResults.content.slice(0, 3000)}...` }
        ];

        // Define the function schema for the RAG pipeline
        const lucidChartSchema = {
            name: "generate_lucid_chart_data",
            description: "Generates data for a Lucid chart based on SAP implementation processes",
            parameters: {
                type: "object",
                properties: {
                    phases: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                description: { type: "string" },
                                steps: {
                                    type: "array",
                                    items: { type: "string" }
                                }
                            }
                        }
                    }
                },
                required: ["phases"]
            }
        };

        // Call OpenAI with function calling
        console.log('Calling Azure OpenAI...');
        const openAIResponse = await callAzureOpenAI(messages, lucidChartSchema);

        // Generate Lucid chart data
        console.log('Generating Lucid chart data...');
        const chartData = await generateLucidChartData(openAIResponse);

        // Perform file operations
        console.log('Performing file operations...');
        await uploadToAzureFileShare('document.json', JSON.stringify(chartData));
        await zipAndRename();

        // Submit to Lucid API
        console.log('Submitting to Lucid API...');
        const lucidResponse = await submitToLucidApi();

        // Prepare response
        const responseMessage = {
            status: 'Chart created successfully.',
            editUrl: lucidResponse.editUrl,
            sourceDocument: searchResults.filename,
            sourceUrl: searchResults.fileUrl
        };

        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(responseMessage)
        };

    } catch (error) {
        console.error('An error occurred during function execution:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: `An error occurred: ${error.message}` })
        };
    }
}

app.http('LucidChartFunction', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: lucidChartFunction
});

module.exports = { lucidChartFunction };