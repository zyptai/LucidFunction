// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.
// File: src/config/azure-config.js
// Summary: Configuration for Azure services including Key Vault.

const _copyright = "Copyright (c) 2024 ZyptAI";
const _license = "Proprietary";
const _path = "src/config/azure-config.js";

module.exports = {
    keyVault: {
        name: process.env.KEY_VAULT_NAME || "zyptai-keyvault",
        uri: process.env.KEY_VAULT_URI || "https://zyptai-keyvault.vault.azure.net/",
    },
    // Add other Azure configurations as needed
    _copyright,
    _license,
    _path
};