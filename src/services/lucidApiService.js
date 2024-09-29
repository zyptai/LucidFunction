// File: src/services/lucidApiService.js
// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.

// Lucid API service for chart operations in SAP implementation processes

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Use environment variables directly
const LUCID_API_KEY = process.env.LUCID_API_KEY;
const LUCID_USER = process.env.LUCID_USER;
const LUCID_API_BASE_URL = 'https://api.lucid.co';

/**
 * Submits a .lucid file to the Lucid API to create a new document
 * @param {string} filePath - The path to the .lucid file
 * @returns {Promise<Object>} The response from the Lucid API containing editUrl and viewUrl
 * @throws {Error} If the submission fails
 */
async function submitToLucidApi(filePath) {
    if (!LUCID_API_KEY || !LUCID_USER) {
        throw new Error("Lucid API credentials are not set. Check your environment variables.");
    }

    try {
        const fileStream = fs.createReadStream(filePath);
        const form = new FormData();
        form.append('file', fileStream, { filename: 'chart.lucid', contentType: 'x-application/vnd.lucid.standardImport' });
        form.append('title', 'SAP Implementation Process Chart');
        form.append('product', 'lucidchart');

        const response = await axios.post(`${LUCID_API_BASE_URL}/documents`, form, {
            headers: {
                'Authorization': `Bearer ${LUCID_API_KEY}`,
                'Lucid-Api-Version': '1',
                'Lucid-User': LUCID_USER,
                ...form.getHeaders(),
            },
        });

        console.log('Lucid API response:', JSON.stringify(response.data, null, 2));

        return {
            editUrl: response.data.editUrl,
            viewUrl: response.data.viewUrl
        };
    } catch (error) {
        console.error('Error during Lucid API document upload:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = {
    submitToLucidApi
};