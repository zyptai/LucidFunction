// File: src/services/fileOperations.js
// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.

// Service for handling file operations related to Lucid chart generation in SAP implementation processes

const { uploadFileToAzureFileShare, downloadFileFromAzureFileShare } = require('./azureStorageService');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

// Use Azure Function's temporary directory
const tempDirectory = process.env.TEMP || '/tmp';

/**
 * Creates a document.json file with the provided content
 * @param {Object} content - The content to be written to document.json
 * @throws {Error} If the file creation fails
 */
async function createDocumentJson(content) {
    const documentPath = path.join(tempDirectory, 'document.json');
    fs.writeFileSync(documentPath, JSON.stringify(content, null, 2));
    console.log('document.json created successfully in temporary directory');
}

/**
 * Zips the document.json file to form.zip
 * @throws {Error} If the zipping process fails
 */
async function zipDocumentJson() {
    const zip = new AdmZip();
    const documentPath = path.join(tempDirectory, 'document.json');
    console.log("start of zipdocumentjson");
    
    if (!fs.existsSync(documentPath)) {
        throw new Error("document.json not found in the temporary directory");
    }

    zip.addLocalFile(documentPath);

    const zipPath = path.join(tempDirectory, 'form.zip');
    zip.writeZip(zipPath);
    console.log('form.zip created successfully in temporary directory');

    return zipPath;
}

/**
 * Renames form.zip to form.lucid and uploads it to Azure File Share
 * @throws {Error} If the renaming or upload process fails
 * @returns {string} The path to the form.lucid file
 */
async function renameAndUploadToAzure() {
    const zipPath = path.join(tempDirectory, 'form.zip');
    const lucidPath = path.join(tempDirectory, 'form.lucid');

    fs.renameSync(zipPath, lucidPath);
    console.log('form.zip renamed to form.lucid');

    const lucidContent = fs.readFileSync(lucidPath);
    await uploadFileToAzureFileShare('form.lucid', lucidContent, 'application/octet-stream');
    console.log('form.lucid uploaded to Azure File Share');

    // Don't clean up local files yet, as we need the path for the Lucid API
    return lucidPath;
}

/**
 * Orchestrates the entire process of creating, zipping, renaming, and uploading the Lucid chart file
 * @param {Object} chartData - The chart data to be processed
 * @throws {Error} If any step in the process fails
 * @returns {string} The path to the form.lucid file
 */
async function processLucidChartFile(chartData) {
    try {
        await createDocumentJson(chartData);
        await zipDocumentJson();
        const lucidPath = await renameAndUploadToAzure();
        console.log('Lucid chart file processed and uploaded successfully.');
        return lucidPath;
    } catch (error) {
        console.error('Error in processLucidChartFile:', error);
        throw error;
    }
}

/**
 * Downloads the form.lucid file from Azure File Share
 * @returns {Promise<string>} The path to the downloaded file
 * @throws {Error} If the download fails
 */
async function downloadLucidFile() {
    const lucidContent = await downloadFileFromAzureFileShare('form.lucid');
    const lucidPath = path.join(tempDirectory, 'form.lucid');
    fs.writeFileSync(lucidPath, lucidContent);
    console.log('form.lucid downloaded from Azure File Share to temporary file system');
    return lucidPath;
}

module.exports = {
    processLucidChartFile,
    downloadLucidFile
};