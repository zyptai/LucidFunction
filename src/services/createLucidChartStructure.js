// File: src/services/createLucidChartStructure.js
// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.

const { generateEmbeddings, getOpenAIResponse } = require('./openAIService');
const { performHybridSearch } = require('./searchService');

async function createLucidChartStructure(userPrompt) {
    try {
        // Generate embeddings for the user prompt
        const embedding = await generateEmbeddings(userPrompt);

        // Perform hybrid search
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
        const openAIResponse = await getOpenAIResponse(messages, lucidChartSchema);

        // Process the OpenAI response and create the Lucid chart structure
        // This is where you'd implement the logic to convert the OpenAI response into the required Lucid chart format
        const lucidChartData = processOpenAIResponse(openAIResponse);

        return {
            chartData: lucidChartData,
            sourceDocument: searchResults.filename,
            sourceUrl: searchResults.fileUrl
        };
    } catch (error) {
        console.error('Error in createLucidChartStructure:', error);
        throw error;
    }
}

function processOpenAIResponse(openAIResponse) {
    // Implement the logic to convert the OpenAI response into the Lucid chart format
    // This is a placeholder and should be replaced with actual implementation
    return openAIResponse.function_call.arguments;
}

module.exports = { createLucidChartStructure };