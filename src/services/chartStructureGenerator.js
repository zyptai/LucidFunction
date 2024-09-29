// File: src/services/chartStructureGenerator.js
// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.

// Service for generating chart structure descriptions for SAP implementation processes

const openAIService = require('./openAIService');

/**
 * Generates a detailed chart structure description based on user prompt and search results
 * @param {string} userPrompt - The user's input prompt
 * @param {Object} searchResults - The results from the hybrid search
 * @returns {string} Detailed process description
 */
async function generateChartStructureDescription(userPrompt, searchResults) {
    console.log('Generating chart structure description...');

    const chartStructurePrompt = `Based on the following user request and relevant documentation, generate a detailed paragraph description of the SAP implementation process:
        User Request: ${userPrompt}
        Relevant Documentation: ${searchResults.content.substring(0, 500)}...
        
        Provide a comprehensive description of the process, including:
        1. Each step in the process
        2. Who or what system is executing each step
        3. Inputs and outputs for each step
        4. Any decision points or branching flows

        The description should be detailed enough to be used as a basis for creating a swimlane diagram.`;

    const response = await openAIService.getOpenAIResponse(
        [{ role: "user", content: chartStructurePrompt }]
    );

    console.log('OpenAI response received.');

    let processDescription;
    if (response.function_call && response.function_call.arguments) {
        const result = JSON.parse(response.function_call.arguments);
        processDescription = result.processDescription;
    } else if (response.content) {
        processDescription = response.content;
    } else {
        console.error('Unexpected response format from OpenAI');
        throw new Error('Invalid process description received from OpenAI');
    }

    console.log('Process description generated success...');
    return processDescription;
}

module.exports = { generateChartStructureDescription };