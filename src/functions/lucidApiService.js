/*
 * Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
 * This software is proprietary to ZyptAI.
 * File path: src/services/lucidApiService.js
 */
// One-line summary: Handles interaction with the Lucidchart API.

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../config/config');

/**
 * Submits a file to the Lucidchart API.
 * @param {string} lucidFilePath - The file path of the .lucid file to upload.
 * @returns {Promise<Object>} - The response from the Lucidchart API.
 */
async function submitToLucidApi(lucidFilePath) {
  const fileStream = fs.createReadStream(lucidFilePath);
  const form = new FormData();
  form.append('file', fileStream, { filename: 'form.lucid', contentType: 'x-application/vnd.lucid.standardImport' });
  form.append('title', 'Generated Chart');
  form.append('product', 'lucidchart');

  const response = await axios.post(`${config.lucidApiBaseUrl}/documents`, form, {
    headers: {
      'Authorization': `Bearer ${config.lucidApiKey}`,
      'Lucid-Api-Version': '1',
      'Lucid-User': config.lucidUser,
      ...form.getHeaders(),
    },
  });

  return { editUrl: response.data.editUrl, viewUrl: response.data.viewUrl };
}

module.exports = { submitToLucidApi };
