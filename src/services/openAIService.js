// File: src/services/openAIService.js
// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.

const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_COMPLETIONS_DEPLOYMENT = process.env.AZURE_OPENAI_COMPLETIONS_DEPLOYMENT;
const AZURE_OPENAI_EMBEDDING_DEPLOYMENT = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT;

let openAIClient;

function initializeOpenAIClient() {
    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
        throw new Error("Azure OpenAI configuration is incomplete. Check your environment variables.");
    }
    openAIClient = new OpenAIClient(AZURE_OPENAI_ENDPOINT, new AzureKeyCredential(AZURE_OPENAI_API_KEY));
}

async function generateEmbeddings(text) {
    if (!openAIClient) initializeOpenAIClient();
    if (!text || typeof text !== 'string') {
        throw new Error("Invalid input for embedding generation. Expected a non-empty string.");
    }
    console.log(`Generating embeddings for text: "${text.substring(0, 50)}..."`);
    try {
        const result = await openAIClient.getEmbeddings(AZURE_OPENAI_EMBEDDING_DEPLOYMENT, [text]);
        if (!result.data || result.data.length === 0) {
            throw new Error("No embedding generated from the API.");
        }
        console.log("Embeddings generated successfully.");
        return result.data[0].embedding;
    } catch (error) {
        console.error("Error in generating embeddings:", error);
        throw error;
    }
}

async function getOpenAIResponse(messages) {
    if (!openAIClient) initializeOpenAIClient();
    try {
        console.log("Sending request to OpenAI API...");
        console.log("Messages:", JSON.stringify(messages).substring(0, 50));

        const result = await openAIClient.getChatCompletions(
            AZURE_OPENAI_COMPLETIONS_DEPLOYMENT,
            messages
        );

        console.log("Received response from OpenAI API...");

        if (result.choices && result.choices.length > 0) {
            return result.choices[0].message;
        } else {
            throw new Error("No response generated from Azure OpenAI");
        }
    } catch (error) {
        console.error("Error in Azure OpenAI call:", error.message);
        throw error;
    }
}

module.exports = {
    getOpenAIResponse,
    generateEmbeddings
};