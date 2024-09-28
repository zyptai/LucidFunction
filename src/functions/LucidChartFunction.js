const { app } = require('@azure/functions');
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const { ShareServiceClient } = require("@azure/storage-file-share");
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const axios = require('axios');
const FormData = require('form-data');

// Configuration for Azure OpenAI, Azure File Share, and Lucid API
const config = {
    azureOpenAiEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
    azureOpenAiCompletionsDeployment: process.env.AZURE_OPENAI_COMPLETIONS_DEPLOYMENT,
    azureOpenAiApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureFileConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    shareName: "lucid-files",  // Share name in Azure File Share
    lucidApiKey: process.env.LUCID_API_KEY,  // Lucid API Key
    lucidUser: process.env.LUCID_USER,  // Lucid User
    lucidApiBaseUrl: 'https://api.lucid.co'
};

// Use Azure Function's temporary directory
const tempDirectory = process.env.TEMP || '/tmp';  // On Windows, it's D:/local/Temp by default

// The content of your document.json
// Define the document structure based on the swimlane flowchart example
const documentData = {
  "version": 1,
  "pages": [
    {
      "id": "mainPage",
      "title": "Swimlanes with Bound Shapes",
      "shapes": [
        {
          "id": "swimlane",
          "type": "swimLanes",
          "boundingBox": {
            "x": 140,
            "y": 200,
            "w": 960,  // Total width matching the sum of lane widths (320 * 3)
            "h": 960   // Total height set to 960
          },
          "style": {
            "stroke": {
              "color": "#062327ff",
              "width": 5
            }
          },
          "magnetize": true,
          "vertical": false,  // Horizontal arrangement of lanes
          "titleBar": {
            "height": 40,
            "verticalText": true
          },
          "lanes": [
            {
              "id": "phaseOne",  // Unique ID for Phase One
              "title": "<span style='color: #ffffff; font-weight: bold; font-size: 14pt;'>Phase One</span>",
              "width": 320,
              "headerFill": "#062327ff",
              "laneFill": "#ffffff"
            },
            {
              "id": "phaseTwo",  // Unique ID for Phase Two
              "title": "<span style='color: #ffffff; font-weight: bold; font-size: 14pt;'>Phase Two</span>",
              "width": 320,
              "headerFill": "#062327ff",
              "laneFill": "#ffffff"
            },
            {
              "id": "phaseThree",  // Unique ID for Phase Three
              "title": "<span style='color: #ffffff; font-weight: bold; font-size: 14pt;'>Phase Three</span>",
              "width": 320,
              "headerFill": "#062327ff",
              "laneFill": "#ffffff"
            }
          ]
        },
        // Shapes within Phase One
        {
          "id": "startRect",
          "type": "rectangle",
          "boundingBox": {
            "x": 200,  // Centered within Phase One
            "y": 260,  // Below the title bar with padding
            "w": 200,
            "h": 80
          },
          "laneId": "phaseOne",  // Assigning to Phase One
          "style": {
            "stroke": {
              "color": "#000000",
              "width": 2
            },
            "fill": {
              "type": "color",
              "color": "#00FF00"
            }
          },
          "text": "Start"
        },
        {
          "id": "processRect1",
          "type": "rectangle",
          "boundingBox": {
            "x": 200,
            "y": 360,
            "w": 200,
            "h": 80
          },
          "laneId": "phaseOne",  // Assigning to Phase One
          "style": {
            "stroke": {
              "color": "#000000",
              "width": 2
            },
            "fill": {
              "type": "color",
              "color": "#FFFF00"
            }
          },
          "text": "Process Phase One"
        },
        // Shapes within Phase Two
        {
          "id": "processRect2",
          "type": "rectangle",
          "boundingBox": {
            "x": 520,  // Centered within Phase Two
            "y": 260,
            "w": 200,
            "h": 80
          },
          "laneId": "phaseTwo",  // Assigning to Phase Two
          "style": {
            "stroke": {
              "color": "#000000",
              "width": 2
            },
            "fill": {
              "type": "color",
              "color": "#FFA500"
            }
          },
          "text": "Process Phase Two"
        },
        {
          "id": "decisionDiamond",
          "type": "diamond",
          "boundingBox": {
            "x": 520,
            "y": 360,
            "w": 120,
            "h": 80
          },
          "laneId": "phaseTwo",  // Assigning to Phase Two
          "style": {
            "stroke": {
              "color": "#000000",
              "width": 2
            },
            "fill": {
              "type": "color",
              "color": "#FFCC00"
            }
          },
          "text": "Decision?"
        },
        // Shapes within Phase Three
        {
          "id": "endRect",
          "type": "rectangle",
          "boundingBox": {
            "x": 840,  // Centered within Phase Three
            "y": 260,
            "w": 200,
            "h": 80
          },
          "laneId": "phaseThree",  // Assigning to Phase Three
          "style": {
            "stroke": {
              "color": "#000000",
              "width": 2
            },
            "fill": {
              "type": "color",
              "color": "#008000"
            }
          },
          "text": "End Phase Three"
        },
        // Additional Shape in Phase Two
        {
          "id": "reviewRect",
          "type": "rectangle",
          "boundingBox": {
            "x": 520,  // Centered within Phase Two
            "y": 460,  // Positioned below existing shapes with padding
            "w": 200,
            "h": 80
          },
          "laneId": "phaseTwo",  // Assigning to Phase Two
          "style": {
            "stroke": {
              "color": "#000000",
              "width": 2
            },
            "fill": {
              "type": "color",
              "color": "#ADD8E6"
            }
          },
          "text": "Review"
        },
        // "Yes" Outcome in Phase Two
        {
          "id": "yesRect",
          "type": "rectangle",
          "boundingBox": {
            "x": 480,  // Positioned to the left within Phase Two
            "y": 460,
            "w": 200,
            "h": 80
          },
          "laneId": "phaseTwo",  // Assigning to Phase Two
          "style": {
            "stroke": {
              "color": "#000000",
              "width": 2
            },
            "fill": {
              "type": "color",
              "color": "#00FFFF"
            }
          },
          "text": "Yes Outcome"
        },
        // "No" Outcome in Phase Two
        {
          "id": "noRect",
          "type": "rectangle",
          "boundingBox": {
            "x": 600,  // Positioned to the right within Phase Two
            "y": 460,
            "w": 200,
            "h": 80
          },
          "laneId": "phaseTwo",  // Assigning to Phase Two
          "style": {
            "stroke": {
              "color": "#000000",
              "width": 2
            },
            "fill": {
              "type": "color",
              "color": "#FF6666"
            }
          },
          "text": "No Outcome"
        }
      ],
      "lines": [
        // Connector from Start to Process Phase One
        {
          "id": "connector1",
          "lineType": "straight",
          "stroke": {
            "color": "#000000",
            "width": 2
          },
          "endpoint1": {
            "type": "shapeEndpoint",
            "style": "none",
            "shapeId": "startRect",
            "position": { "x": 0.5, "y": 1 }  // Bottom center of Start
          },
          "endpoint2": {
            "type": "shapeEndpoint",
            "style": "arrow",
            "shapeId": "processRect1",
            "position": { "x": 0.5, "y": 0 }  // Top center of Process Phase One
          }
        },
        // Connector from Process Phase One to Process Phase Two
        {
          "id": "connector2",
          "lineType": "straight",
          "stroke": {
            "color": "#000000",
            "width": 2
          },
          "endpoint1": {
            "type": "shapeEndpoint",
            "style": "none",
            "shapeId": "processRect1",
            "position": { "x": 1, "y": .5 }
          },
          "endpoint2": {
            "type": "shapeEndpoint",
            "style": "arrow",
            "shapeId": "processRect2",
            "position": { "x": 0, "y": 0.5 }
          }
        },
        // Connector from Process Phase Two to Decision
        {
          "id": "connector3",
          "lineType": "straight",
          "stroke": {
            "color": "#000000",
            "width": 2
          },
          "endpoint1": {
            "type": "shapeEndpoint",
            "style": "none",
            "shapeId": "processRect2",
            "position": { "x": 1, "y": 0.5 }  // Right center of Process Phase Two
          },
          "endpoint2": {
            "type": "shapeEndpoint",
            "style": "arrow",
            "shapeId": "decisionDiamond",
            "position": { "x": 0, "y": 0.5 }  // Left center of Decision
          }
        },
        // Connector from Decision to End Phase Three
        {
          "id": "connector4",
          "lineType": "straight",
          "stroke": {
            "color": "#000000",
            "width": 2
          },
          "endpoint1": {
            "type": "shapeEndpoint",
            "style": "none",
            "shapeId": "decisionDiamond",
            "position": { "x": 0.5, "y": 1 }  // Bottom center of Decision
          },
          "endpoint2": {
            "type": "shapeEndpoint",
            "style": "arrow",
            "shapeId": "endRect",
            "position": { "x": 0.5, "y": 0 }  // Top center of End Phase Three
          }
        },
        // Connector from Decision to Yes Outcome
        {
          "id": "connector5",
          "lineType": "straight",
          "stroke": {
            "color": "#000000",
            "width": 2
          },
          "endpoint1": {
            "type": "shapeEndpoint",
            "style": "none",
            "shapeId": "decisionDiamond",
            "position": { "x": 0.75, "y": 1 }  // Bottom right of Decision?
          },
          "endpoint2": {
            "type": "shapeEndpoint",
            "style": "arrow",
            "shapeId": "yesRect",
            "position": { "x": 0, "y": 0.5 }  // Left center of Yes Outcome
          }
        },
        // Connector from Decision to No Outcome
        {
          "id": "connector6",
          "lineType": "straight",
          "stroke": {
            "color": "#000000",
            "width": 2
          },
          "endpoint1": {
            "type": "shapeEndpoint",
            "style": "none",
            "shapeId": "decisionDiamond",
            "position": { "x": 0.25, "y": 1 }  // Bottom left of Decision?
          },
          "endpoint2": {
            "type": "shapeEndpoint",
            "style": "arrow",
            "shapeId": "noRect",
            "position": { "x": 1, "y": 0.5 }  // Right center of No Outcome
          }
        }
      ]
    }
  ]
}

function logEnvironmentVariables() {
    console.log('Logging environment variables:');
    console.log(`AZURE_OPENAI_ENDPOINT: ${config.azureOpenAiEndpoint ? 'Set' : 'Not set'}`);
    console.log(`AZURE_OPENAI_COMPLETIONS_DEPLOYMENT: ${config.azureOpenAiCompletionsDeployment ? 'Set' : 'Not set'}`);
    console.log(`AZURE_OPENAI_API_KEY: ${config.azureOpenAiApiKey ? 'Set' : 'Not set'}`);
    console.log(`AZURE_STORAGE_CONNECTION_STRING: ${config.azureFileConnectionString ? 'Set' : 'Not set'}`);
    console.log(`LUCID_API_KEY: ${config.lucidApiKey ? 'Set' : 'Not set'}`);
    console.log(`LUCID_USER: ${config.lucidUser ? 'Set' : 'Not set'}`);
}

// Function to upload files to Azure File Share
async function uploadFileToAzureFileShare(fileName, content, contentType = 'application/json') {
    const shareServiceClient = ShareServiceClient.fromConnectionString(config.azureFileConnectionString);
    const shareClient = shareServiceClient.getShareClient(config.shareName);
    
    // Ensure the share exists
    await shareClient.createIfNotExists();

    const fileClient = shareClient.rootDirectoryClient.getFileClient(fileName);
    const bufferContent = Buffer.from(content, 'utf-8');
    
    await fileClient.uploadData(bufferContent, {
        contentSettings: { contentType }
    });

    console.log(`${fileName} uploaded successfully to Azure File Share`);
}

// Function to zip the document.json
async function zipFile() {
    const zip = new AdmZip();
    zip.addFile('document.json', Buffer.from(JSON.stringify(documentData, null, 2), 'utf-8'));

    // Write zip to the temporary directory instead of __dirname
    const zipPath = path.join(tempDirectory, 'form.zip');  // Use tempDirectory
    zip.writeZip(zipPath);
    console.log('form.zip created successfully in temporary directory');

    // Read zip content
    const zipContent = fs.readFileSync(zipPath);

    // Upload the zip file
    await uploadFileToAzureFileShare('form.zip', zipContent, 'application/zip');

    // Rename form.zip to form.lucid in Azure File Share
    const shareServiceClient = ShareServiceClient.fromConnectionString(config.azureFileConnectionString);
    const shareClient = shareServiceClient.getShareClient(config.shareName);
    const rootDirectoryClient = shareClient.rootDirectoryClient;

    // Get file clients
    const fileClientZip = rootDirectoryClient.getFileClient('form.zip');
    const fileClientLucid = rootDirectoryClient.getFileClient('form.lucid');

    // Copy form.zip to form.lucid (Azure File Share doesn't support renaming directly)
    const copyResponse = await fileClientLucid.startCopyFromURL(fileClientZip.url);
    console.log('form.lucid created by copying form.zip');

    // Delete form.zip after copying
    await fileClientZip.delete();
    console.log('form.zip deleted after renaming to form.lucid');
}

// Function to download the form.lucid file from Azure File Share to the temporary filesystem
async function downloadFromAzureFileShare() {
    const shareServiceClient = ShareServiceClient.fromConnectionString(config.azureFileConnectionString);
    const shareClient = shareServiceClient.getShareClient(config.shareName);
    const rootDirectoryClient = shareClient.rootDirectoryClient;
    console.log('Submitting form to Lucid API...');
    
    // Get the file client for form.lucid
    const fileClientLucid = rootDirectoryClient.getFileClient('form.lucid');
    
    // Download the file content from Azure File Share
    const downloadResponse = await fileClientLucid.download();

    // Set the path to the temporary file system for Azure Functions
    const lucidFilePath = path.join(tempDirectory, 'form.lucid');  // Use tempDirectory
    
    // Save the file in the Azure Function's temporary filesystem
    const writableStream = fs.createWriteStream(lucidFilePath);
    downloadResponse.readableStreamBody.pipe(writableStream);

    await new Promise((resolve, reject) => {
        writableStream.on('finish', resolve);
        writableStream.on('error', reject);
    });

    console.log('form.lucid downloaded from Azure File Share to temporary file system');
    
    return lucidFilePath;
}

// Function to submit the form.lucid file to Lucid API
async function submitToLucidApi() {
    try {
        const lucidFilePath = await downloadFromAzureFileShare();
        const fileStream = fs.createReadStream(lucidFilePath);
        const form = new FormData();
        form.append('file', fileStream, { filename: 'form.lucid', contentType: 'x-application/vnd.lucid.standardImport' });
        form.append('title', 'Generated Chart');
        form.append('product', 'lucidchart');

        const createDocResponse = await axios.post(`${config.lucidApiBaseUrl}/documents`, form, {
            headers: {
                'Authorization': `Bearer ${config.lucidApiKey}`,
                'Lucid-Api-Version': '1',
                'Lucid-User': config.lucidUser,
                ...form.getHeaders(),
            },
        });

        // Return the edit and view URLs
        return {
            editUrl: createDocResponse.data.editUrl,
            viewUrl: createDocResponse.data.viewUrl
        };
    } catch (error) {
      console.error('Error during Lucid API document upload:', error.response?.data || error.message);
      throw error;
    }
}

// Azure Function to handle the entire process
async function lucidChartFunction(req) {
    console.log('LucidChartFunction triggered.');

    try {
        logEnvironmentVariables();
        validateEnvironmentVariables();

        const HARDCODED_QUERY = req.body.prompt || "Explain the phases of an SAP implementation project";  // Taking prompt from the request body

        // Execute the OpenAI query
        const response = await getOpenAIResponse(HARDCODED_QUERY);
        console.log('OpenAI response received.');

        let generatedContent = "No response generated.";
        if (response.choices && response.choices.length > 0) {
            generatedContent = response.choices[0].message.content.trim();
        }

        // Upload the document.json to Azure File Share
        await uploadFileToAzureFileShare('document.json', JSON.stringify(documentData, null, 2));

        // Zip the document.json and rename it to form.lucid
        await zipFile();

        // Submit the form.lucid file to Lucid API and get the edit URL
        const lucidResponse = await submitToLucidApi();

        const responseMessage = {
            message: 'Chart created successfully.',
            generatedContent: generatedContent,
            editUrl: lucidResponse.editUrl,  // Returning the Edit URL to the Word add-on
            viewUrl: lucidResponse.viewUrl   // Optionally return the View URL
        };

        return {
            status: 200,
            body: responseMessage,
        };

    } catch (error) {
        console.error('An error occurred during function execution:', error);
        return {
            status: 500,
            body: `An error occurred: ${error.message}`
        };
    }
}

function validateEnvironmentVariables() {
    const missingVars = [];
    if (!config.azureOpenAiEndpoint) missingVars.push('AZURE_OPENAI_ENDPOINT');
    if (!config.azureOpenAiCompletionsDeployment) missingVars.push('AZURE_OPENAI_COMPLETIONS_DEPLOYMENT');
    if (!config.azureOpenAiApiKey) missingVars.push('AZURE_OPENAI_API_KEY');
    if (!config.azureFileConnectionString) missingVars.push('AZURE_STORAGE_CONNECTION_STRING');
    if (!config.lucidApiKey) missingVars.push('LUCID_API_KEY');
    if (!config.lucidUser) missingVars.push('LUCID_USER');

    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
}

async function getOpenAIResponse(prompt) {
    try {
        const openAiClient = new OpenAIClient(
            config.azureOpenAiEndpoint,
            new AzureKeyCredential(config.azureOpenAiApiKey)
        );

        const response = await openAiClient.getChatCompletions(
            config.azureOpenAiCompletionsDeployment,
            [{ role: "user", content: prompt }],
            { maxTokens: 1000, temperature: 0.5 }
        );

        return response;
    } catch (error) {
        console.error("Error in getOpenAIResponse:", error);
        throw error;
    }
}

app.http('LucidChartFunction', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: lucidChartFunction
});

module.exports = { lucidChartFunction };
