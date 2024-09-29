// File: src/services/lucidChartGenerator.js
// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.

// Service for generating Lucid chart data for SAP implementation processes

/**
 * Generates Lucid chart data based on user prompt and relevant documentation
 * @param {string} userPrompt - The user's input prompt
 * @returns {Object} Lucid chart data structure
 */
async function generateLucidChartData(userPrompt) {
    console.log('Generating Lucid chart data...');
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

    // In a real implementation, you would use the userPrompt to modify the documentData
    // For now, we're just returning the hardcoded structure
    return documentData;
}

module.exports = { generateLucidChartData };