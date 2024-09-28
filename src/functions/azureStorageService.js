/*
 * Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
 * This software is proprietary to ZyptAI.
 * File path: src/services/azureStorageService.js
 */
// One-line summary: Handles interactions with Azure File Share for uploading and downloading files.

const { ShareServiceClient } = require("@azure/storage-file-share");
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

/**
 * Uploads a file to Azure File Share.
 * @param {string} fileName - The name of the file to be uploaded.
 * @param {Buffer|string} content - The file content to upload.
 * @param {string} [contentType='application/json'] - The MIME type of the file.
 */
async function uploadFileToAzureFileShare(fileName, content, contentType = 'application/json') {
  const shareServiceClient = ShareServiceClient.fromConnectionString(config.azureFileConnectionString);
  const shareClient = shareServiceClient.getShareClient(config.shareName);
  
  await shareClient.createIfNotExists();
  const fileClient = shareClient.rootDirectoryClient.getFileClient(fileName);
  await fileClient.uploadData(Buffer.from(content), { contentSettings: { contentType } });
}

/**
 * Zips the document and uploads it to Azure File Share.
 * @param {Object} documentData - The JSON document data to be zipped and uploaded.
 */
async function zipAndUploadDocument(documentData) {
  const zip = new AdmZip();
  zip.addFile('document.json', Buffer.from(JSON.stringify(documentData, null, 2), 'utf-8'));
  const zipPath = path.join(config.tempDirectory, 'form.zip');
  zip.writeZip(zipPath);
  
  const zipContent = fs.readFileSync(zipPath);
  await uploadFileToAzureFileShare('form.zip', zipContent, 'application/zip');
}

module.exports = { uploadFileToAzureFileShare, zipAndUploadDocument };
