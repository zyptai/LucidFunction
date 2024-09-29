// File: src/services/azureStorageService.js
// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.

// Azure Storage service for file operations in SAP implementation processes

const { ShareServiceClient } = require("@azure/storage-file-share");

// Use environment variables directly
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const shareName = "lucid-files";  // This could also be an environment variable if it changes between environments

/**
 * Uploads a file to Azure File Share
 * @param {string} fileName - The name of the file to be uploaded
 * @param {string|Buffer} content - The content of the file
 * @param {string} [contentType='application/json'] - The MIME type of the content
 * @throws {Error} If the upload fails
 */
async function uploadFileToAzureFileShare(fileName, content, contentType = 'application/json') {
    if (!connectionString) {
        throw new Error("Azure Storage connection string is not set. Check your environment variables.");
    }
    console.log("I made it to uploadfiletoazurefileshare")
    const shareServiceClient = ShareServiceClient.fromConnectionString(connectionString);
    const shareClient = shareServiceClient.getShareClient(shareName);
    
    // Ensure the share exists
    await shareClient.createIfNotExists();

    const fileClient = shareClient.rootDirectoryClient.getFileClient(fileName);
    const bufferContent = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');
    console.log("Is this where the problem is")
    await fileClient.uploadData(bufferContent, {
        contentSettings: { contentType }
    });

    console.log(`${fileName} uploaded successfully to Azure File Share`);
}

/**
 * Downloads a file from Azure File Share
 * @param {string} fileName - The name of the file to be downloaded
 * @returns {Promise<Buffer>} The file content as a Buffer
 * @throws {Error} If the download fails
 */
async function downloadFileFromAzureFileShare(fileName) {
    if (!connectionString) {
        throw new Error("Azure Storage connection string is not set. Check your environment variables.");
    }

    const shareServiceClient = ShareServiceClient.fromConnectionString(connectionString);
    const shareClient = shareServiceClient.getShareClient(shareName);
    const fileClient = shareClient.rootDirectoryClient.getFileClient(fileName);

    const downloadResponse = await fileClient.download();
    return streamToBuffer(downloadResponse.readableStreamBody);
}

/**
 * Converts a readable stream to a Buffer
 * @param {NodeJS.ReadableStream} readableStream - The readable stream to convert
 * @returns {Promise<Buffer>} The stream content as a Buffer
 */
async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on("end", () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on("error", reject);
    });
}

module.exports = {
    uploadFileToAzureFileShare,
    downloadFileFromAzureFileShare
};