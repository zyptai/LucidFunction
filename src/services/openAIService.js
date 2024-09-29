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
    try {
        const result = await openAIClient.getEmbeddings(AZURE_OPENAI_EMBEDDING_DEPLOYMENT, [text]);
        return result.data[0].embedding;
    } catch (error) {
        console.error("Error in generating embeddings:", error);
        throw error;
    }
}

async function getOpenAIResponse(messages, functionSchema = null) {
    if (!openAIClient) initializeOpenAIClient();
    try {
        let options = {
            temperature: 0.7,
            max_tokens: 800,
        };

        if (functionSchema) {
            options.functions = [functionSchema];
            options.function_call = { name: functionSchema.name };
        }

        const result = await openAIClient.getChatCompletions(
            AZURE_OPENAI_COMPLETIONS_DEPLOYMENT,
            messages,
            options
        );

        if (result.choices && result.choices.length > 0) {
            const choice = result.choices[0];
            if (choice.message.function_call) {
                return {
                    function_call: {
                        name: choice.message.function_call.name,
                        arguments: JSON.parse(choice.message.function_call.arguments)
                    }
                };
            } else {
                return choice.message;
            }
        } else {
            throw new Error("No response generated from Azure OpenAI");
        }
    } catch (error) {
        console.error("Error in Azure OpenAI call:", error);
        throw error;
    }
}

module.exports = {
    getOpenAIResponse,
    generateEmbeddings
};