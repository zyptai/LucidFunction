// File: src/services/searchService.js
// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.

const { SearchClient, AzureKeyCredential } = require("@azure/search-documents");

const SEARCH_ENDPOINT = process.env.SEARCH_ENDPOINT;
const SEARCH_INDEX_NAME = process.env.SEARCH_INDEX_NAME;
const SEARCH_API_KEY = process.env.SEARCH_API_KEY;

let searchClient;

function initializeSearchClient() {
    if (!SEARCH_ENDPOINT || !SEARCH_INDEX_NAME || !SEARCH_API_KEY) {
        throw new Error("Azure Cognitive Search configuration is incomplete. Check your environment variables.");
    }
    searchClient = new SearchClient(
        SEARCH_ENDPOINT,
        SEARCH_INDEX_NAME,
        new AzureKeyCredential(SEARCH_API_KEY)
    );
}

async function performHybridSearch(query, vector) {
    if (!searchClient) initializeSearchClient();

    try {
        const searchResults = await searchClient.search(query, {
            select: ["description", "chunkindex", "filename", "fileUrl"],
            vectorQueries: [
                {
                    kind: "vector",
                    fields: ["descriptionVector"],
                    kNearestNeighborsCount: 48,
                    vector: vector,
                },
            ],
            vectorFilterMode: "hybridRerank",
            top: 48,
        });

        let allContent = "";
        let chunkCount = 0;
        let totalChunks = 0;
        let filename = "";
        let fileUrl = "";

        for await (const result of searchResults.results) {
            allContent += result.document.description + " ";
            chunkCount++;
            totalChunks = Math.max(totalChunks, result.document.totalChunks || 0);
            if (!filename && result.document.filename) {
                filename = result.document.filename;
            }
            if (!fileUrl && result.document.fileUrl) {
                fileUrl = result.document.fileUrl;
            }
        }

        return {
            content: allContent,
            filename: filename,
            fileUrl: fileUrl,
            chunkCount: chunkCount,
            totalChunks: totalChunks
        };
    } catch (error) {
        console.error("Error in hybrid search:", error);
        throw error;
    }
}

module.exports = { performHybridSearch };