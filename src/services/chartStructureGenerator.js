// File: src/services/chartStructureGenerator.js
// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.

// Service for generating chart structure descriptions for SAP implementation processes

const openAIService = require('./openAIService');

/**
 * Generates a detailed chart structure description based on user prompt
 * @param {string} userPrompt - The user's input prompt
 * @returns {Object} Object containing enhancedPrompt and processDescription
 */
async function generateChartStructureDescription(userPrompt) {
    console.log('Generating chart structure description...');

    const chartStructurePrompt = `Based on the following user request, generate a detailed list of objects that would go into a swimlane process flow:
        User Request: ${userPrompt}
        
        Provide a comprehensive description of the process, must include the following in list form:
        1. Swimlane for each of the actors in the process flow - whether it be a system or person/role.  Include a count of swimlanes.
        2. Each step in the process would be represented with a shape.  Include a count of shapes.
           - each shape would have a shape type with their standard meanings: rectangle, diamond, ellipse, triangle, hexagon. 
            octagon, cloud, document, cylinder, parallelogram, roundedRectangle, cube, can, flowchartDocument, step, callout, star
           - each shape would note which swimlane it would go in
        3. Line connectors would be used to show how processes are connected to each other.  Include a count of lineconnectors.
            - each line connector would state it's starting shape and ending shape

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

    console.log('Process description generated successfully.');

    // Combine the original user prompt with the chart structure prompt for embedding
    const enhancedPrompt = `${userPrompt}\n\n${chartStructurePrompt}`;

    return { enhancedPrompt, processDescription };
}

module.exports = { generateChartStructureDescription };