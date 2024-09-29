// File: src/services/openAIService.js
// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.

// Service for interacting with Azure OpenAI for SAP implementation assistance

const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

// Configuration for Azure OpenAI
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_COMPLETIONS_DEPLOYMENT = process.env.AZURE_OPENAI_COMPLETIONS_DEPLOYMENT;
const AZURE_OPENAI_EMBEDDING_DEPLOYMENT = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT;

let openAiClient;

/**
 * Initializes the OpenAI client
 * @throws {Error} If the Azure OpenAI configuration is incomplete
 */
function initializeOpenAiClient() {
    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
        throw new Error("Azure OpenAI configuration is incomplete. Check your environment variables.");
    }
    openAiClient = new OpenAIClient(AZURE_OPENAI_ENDPOINT, new AzureKeyCredential(AZURE_OPENAI_API_KEY));
}

/**
 * Generates embeddings for the given text
 * @param {string} text - The text to generate embeddings for
 * @returns {number[]} The generated embedding
 * @throws {Error} If the embedding generation fails
 */
async function generateEmbeddings(text) {
    if (!openAiClient) initializeOpenAiClient();
    
    const startTime = Date.now();
    try {
        const result = await openAiClient.getEmbeddings(AZURE_OPENAI_EMBEDDING_DEPLOYMENT, [text]);
        const endTime = Date.now();
        console.log(`Embedding generation time: ${endTime - startTime} ms`);
        console.log(`Embedding tokens: ${result.usage.totalTokens}`);
        return result.data[0].embedding;
    } catch (error) {
        console.error("Error in embedding generation:", error);
        throw error;
    }
}

/**
 * Calls Azure OpenAI with the given messages and function definition
 * @param {Array} messages - The conversation messages
 * @param {Object} functionDefinition - The function definition for structured output
 * @returns {Object} The response from OpenAI
 * @throws {Error} If the API call fails or no response is generated
 */
async function callAzureOpenAI(messages, functionDefinition) {
    if (!openAiClient) initializeOpenAiClient();

    try {
        const startTime = Date.now();
        const response = await openAiClient.getChatCompletions(
            AZURE_OPENAI_COMPLETIONS_DEPLOYMENT,
            messages,
            {
                functions: [functionDefinition],
                functionCall: { name: functionDefinition.name },
            }
        );
        const endTime = Date.now();

        console.log(`OpenAI API call time: ${endTime - startTime} ms`);
        console.log(`OpenAI API call tokens: ${response.usage.totalTokens}`);

        if (response.choices && response.choices.length > 0) {
            const functionCallResult = response.choices[0].message.functionCall;
            return JSON.parse(functionCallResult.arguments);
        } else {
            throw new Error("No response generated from OpenAI");
        }
    } catch (error) {
        console.error("Error in Azure OpenAI call:", error);
        throw error;
    }
}

module.exports = { generateEmbeddings, callAzureOpenAI };