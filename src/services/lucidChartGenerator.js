// File: src/services/lucidChartGenerator.js
// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.

// Service for generating Lucid chart data for SAP implementation processes

const openAIService = require('./openAIService');

/**
 * Generates Lucid chart data based on the provided chart structure description
 * @param {Object} chartStructureDescription - The description of the chart structure as returned by the first OpenAI call
 * @returns {Object} Lucid chart data structure
 */
async function generateLucidChartData(chartStructureDescription) {
    console.log('Generating Lucid chart data...');

    // Step 1: Prepare the prompt for the second OpenAI call
    const lucidChartPrompt = `Create a JSON structure for a Lucid chart based on the following chart structure description:
        ${JSON.stringify(chartStructureDescription, null, 2)}
        Generate a JSON structure that follows the Lucid chart format, including swimlanes, shapes, connections, and styling.`;

    const lucidChartSchema = {
        name: "create_lucid_chart_json",
        description: "Creates a JSON structure for a Lucid chart",
        parameters: {
            type: "object",
            properties: {
                version: { type: "number" },
                pages: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            title: { type: "string" },
                            shapes: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string" },
                                        type: { type: "string" },
                                        text: { type: "string" },
                                        boundingBox: {
                                            type: "object",
                                            properties: {
                                                x: { type: "number" },
                                                y: { type: "number" },
                                                w: { type: "number" },
                                                h: { type: "number" }
                                            }
                                        },
                                        style: {
                                            type: "object",
                                            properties: {
                                                fill: {
                                                    type: "object",
                                                    properties: {
                                                        color: { type: "string" }
                                                    }
                                                },
                                                stroke: {
                                                    type: "object",
                                                    properties: {
                                                        color: { type: "string" },
                                                        width: { type: "number" }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            lines: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string" },
                                        type: { type: "string" },
                                        startShapeId: { type: "string" },
                                        endShapeId: { type: "string" },
                                        text: { type: "string" },
                                        style: {
                                            type: "object",
                                            properties: {
                                                stroke: {
                                                    type: "object",
                                                    properties: {
                                                        color: { type: "string" },
                                                        width: { type: "number" }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            required: ["version", "pages"]
        }
    };

    // Step 2: Make the second call to Azure OpenAI
    const lucidChartJSON = await openAIService.getOpenAIResponse(
        [{ role: "user", content: lucidChartPrompt }],
        lucidChartSchema
    );

    // Step 3: Parse and return the Lucid chart JSON
    return JSON.parse(lucidChartJSON.function_call.arguments);
}

module.exports = { generateLucidChartData };