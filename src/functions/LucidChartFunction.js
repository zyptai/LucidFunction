// File: src/functions/LucidChartFunction.js
// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.

// Main Azure Function for generating Lucid charts for SAP implementation processes

const { app } = require('@azure/functions');
const openAIService = require('../services/openAIService');
const { performHybridSearch } = require('../services/searchService');
const { generateLucidChartData } = require('../services/lucidChartGenerator');
const { uploadFileToAzureFileShare, downloadFileFromAzureFileShare } = require('../services/azureStorageService');
const { submitToLucidApi } = require('../services/lucidApiService');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

// Use Azure Function's temporary directory
const tempDirectory = process.env.TEMP || '/tmp';

/**
 * Azure Function to handle the Lucid chart generation process using RAG pipeline
 * @param {Object} req - The HTTP request object
 * @returns {Object} HTTP response object with status and body
 */
const lucidChartFunction = async function(req) {
    console.log('LucidChartFunction triggered.');

    try {
        const userPrompt = req.body.prompt || "Explain the phases of an SAP implementation project";
        console.log(`Received prompt: ${userPrompt}`);

        // Generate embeddings for the user prompt
        console.log('Generating embeddings...');
        const embedding = await openAIService.generateEmbeddings(userPrompt);

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
        const openAIResponse = await openAIService.getOpenAIResponse(messages, lucidChartSchema);

        // Generate Lucid chart data
        console.log('Generating Lucid chart data...');
        const chartData = await generateLucidChartData(userPrompt);

        // Perform file operations
        console.log('Performing file operations...');
        
        // Step 1: Create document.json
        const documentPath = path.join(tempDirectory, 'document.json');
        fs.writeFileSync(documentPath, JSON.stringify(chartData, null, 2));
        console.log('document.json created successfully');

        // Step 2: Zip document.json to form.zip
        const zip = new AdmZip();
        zip.addLocalFile(documentPath);
        const zipPath = path.join(tempDirectory, 'form.zip');
        zip.writeZip(zipPath);
        console.log('form.zip created successfully');

        // Step 3: Rename form.zip to form.lucid
        const lucidPath = path.join(tempDirectory, 'form.lucid');
        fs.renameSync(zipPath, lucidPath);
        console.log('form.zip renamed to form.lucid');

        // Upload form.lucid to Azure File Share
        const lucidContent = fs.readFileSync(lucidPath);
        await uploadFileToAzureFileShare('form.lucid', lucidContent, 'application/octet-stream');
        console.log('form.lucid uploaded to Azure File Share');

        // Submit to Lucid API
        console.log('Submitting to Lucid API...');
        const lucidResponse = await submitToLucidApi(lucidPath);

        // Clean up temporary files
        fs.unlinkSync(documentPath);
        fs.unlinkSync(lucidPath);

        // Prepare response
        const responseMessage = {
            status: 'Chart created successfully.',
            editUrl: lucidResponse.editUrl,
            viewUrl: lucidResponse.viewUrl,
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
};

app.http('LucidChartFunction', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: lucidChartFunction
});

module.exports = { lucidChartFunction };