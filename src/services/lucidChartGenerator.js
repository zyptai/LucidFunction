// File: src/services/lucidChartGenerator.js
// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.

const openAIService = require('./openAIService');

async function generateLucidChartData(processDescription) {
    console.log('Generating Lucid chart data...');
    console.log('Process Description:', processDescription.substring(0, 200));
    
    const lucidChartPrompt = `
Create a JSON structure for a Lucid chart based on the following process description and guidelines:

Process Description:
${processDescription}

Guidelines for Generating Lucid API JSON Files:

1. JSON Document Structure:
   - version: Specify version 1.
   - pages: Array containing one page object.
     - id: Unique identifier for the page.
     - title: Title of the page (use "SAP Implementation Process").
     - shapes: Array of shape objects (including one swimlane and process step shapes).
     - lines: Array of line (connector) objects.

2. Defining Swimlane:
   - Create a single swimlane object with the following properties:
     - id: "mainSwimlane"
     - type: "swimLanes"
     - boundingBox: { x: 0, y: 0, w: 800, h: 600 }
     - style: { stroke: { color: "#000000", width: 2 } }
     - magnetize: true
     - vertical: false (IMPORTANT: Include this property)
     - titleBar: { height: 40, verticalText: false }
     - lanes: Array of lane objects (create one for each main phase or system in the process)
       - id: Unique identifier for each lane (e.g., "lane1", "lane2", etc.)
       - title: HTML string for the lane title (e.g., "<span style='color: #000000; font-weight: bold;'>Phase Name</span>")
       - width: Width of the lane (ensure sum of all widths equals the total width of the swimlane)
       - headerFill: Use alternating shades of grey (e.g., "#E0E0E0", "#C0C0C0")
       - laneFill: "#FFFFFF" (white) for all lanes

3. Adding Shapes to Swimlanes:
   - Create shape objects for each step in the process:
     - id: Unique identifier for the shape (e.g., "shape1", "shape2", etc.)
     - type: Use only the following valid shape types: rectangle, diamond, ellipse, triangle, octagon, cloud, star
     - boundingBox: { x: [position within lane], y: [vertical position], w: 160, h: 60 }
     - laneId: ID of the lane this shape belongs to
     - style: { 
         stroke: { color: "#000000", width: 2 },
         fill: { 
           type: "solid",
           color: "#FFFFFF" 
         }
       }
     - text: Label or content within the shape (use black text color)

4. Connecting Shapes with Lines:
   - Create line objects to connect the shapes:
     - id: Unique identifier for the connector (e.g., "connector1", "connector2", etc.)
     - lineType: "straight" or "curved" (prefer "straight" for simplicity)
     - stroke: { color: "#000000", width: 2 }
     - endpoint1: {
         type: "shapeEndpoint",
         style: "none",
         shapeId: [ID of the source shape],
         position: { x: [0-1], y: [0-1] }
       }
     - endpoint2: {
         type: "shapeEndpoint",
         style: "arrow",
         shapeId: [ID of the target shape],
         position: { x: [0-1], y: [0-1] }
       }

5. Styling and Positioning:
   - Use consistent colors and stroke widths throughout the chart.
   - Position shapes within their respective lanes, maintaining clear flow.
   - Ensure that shapes do not overlap and are evenly spaced within lanes.

IMPORTANT: 
- All charts MUST include swimlanes, shapes, and connecting lines.
- Ensure that the swimlane object contains the 'vertical' property set to false, and the 'lanes' property with an array of lane objects. 
- The sum of all lane widths must exactly equal the total width of the swimlane (800 in this case).
- Use only the specified valid shape types and colors.
- Always use "color" as the fill type for shapes.
- Generate at least one shape for each lane in the swimlane.
- Ensure that each shape has a unique ID and is properly positioned within its lane.
- Create connector lines between shapes to represent the process flow.
- Use white (#FFFFFF) for lane backgrounds and alternating shades of grey for lane headers.
- Use black (#000000) for all text and line colors.

Generate a complete JSON structure that accurately represents the SAP implementation process described earlier, following these guidelines strictly. Ensure all IDs are unique and the structure is valid according to the Lucid API specifications.
`;

console.log('Lucid Chart Prompt:', lucidChartPrompt.substring(0, 200));


    const lucidChartSchema = {
        type: "object",
        properties: {
            version: { type: "number" },
            pages: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                        shapes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "string" },
                                    type: { type: "string" },
                                    boundingBox: {
                                        type: "object",
                                        properties: {
                                            x: { type: "number" },
                                            y: { type: "number" },
                                            w: { type: "number" },
                                            h: { type: "number" }
                                        },
                                        required: ["x", "y", "w", "h"]
                                    },
                                    style: {
                                        type: "object",
                                        properties: {
                                            stroke: {
                                                type: "object",
                                                properties: {
                                                    color: { type: "string" },
                                                    width: { type: "number" }
                                                },
                                                required: ["color", "width"]
                                            },
                                            fill: {
                                                type: "object",
                                                properties: {
                                                    type: { type: "string" },
                                                    color: { type: "string" }
                                                },
                                                required: ["type", "color"]
                                            }
                                        },
                                        required: ["stroke", "fill"]
                                    },
                                    text: { type: "string" },
                                    laneId: { type: "string" },
                                    vertical: { type: "boolean" },
                                    magnetize: { type: "boolean" },
                                    titleBar: {
                                        type: "object",
                                        properties: {
                                            height: { type: "number" },
                                            verticalText: { type: "boolean" }
                                        },
                                        required: ["height", "verticalText"]
                                    },
                                    lanes: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                id: { type: "string" },
                                                title: { type: "string" },
                                                width: { type: "number" },
                                                headerFill: { type: "string" },
                                                laneFill: { type: "string" }
                                            },
                                            required: ["id", "title", "width", "headerFill", "laneFill"]
                                        }
                                    }
                                },
                                required: ["id", "type", "boundingBox", "style"]
                            }
                        },
                        lines: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "string" },
                                    lineType: { type: "string" },
                                    stroke: {
                                        type: "object",
                                        properties: {
                                            color: { type: "string" },
                                            width: { type: "number" }
                                        },
                                        required: ["color", "width"]
                                    },
                                    endpoint1: {
                                        type: "object",
                                        properties: {
                                            type: { type: "string" },
                                            style: { type: "string" },
                                            shapeId: { type: "string" },
                                            position: {
                                                type: "object",
                                                properties: {
                                                    x: { type: "number" },
                                                    y: { type: "number" }
                                                },
                                                required: ["x", "y"]
                                            }
                                        },
                                        required: ["type", "style", "shapeId", "position"]
                                    },
                                    endpoint2: {
                                        type: "object",
                                        properties: {
                                            type: { type: "string" },
                                            style: { type: "string" },
                                            shapeId: { type: "string" },
                                            position: {
                                                type: "object",
                                                properties: {
                                                    x: { type: "number" },
                                                    y: { type: "number" }
                                                },
                                                required: ["x", "y"]
                                            }
                                        },
                                        required: ["type", "style", "shapeId", "position"]
                                    }
                                },
                                required: ["id", "lineType", "stroke", "endpoint1", "endpoint2"]
                            }
                        }
                    },
                    required: ["id", "title", "shapes", "lines"]
                }
            }
        },
        required: ["version", "pages"]
    };

    const lucidChartResponse = await openAIService.getOpenAIResponse(
        [{ role: "user", content: lucidChartPrompt }],
        { name: "create_lucid_chart_json", parameters: lucidChartSchema }
    );

    //console.log('OpenAI Response for Lucid Chart:', JSON.stringify(lucidChartResponse, null, 2));
    console.log(
        'OpenAI Response for Lucid Chart:',
        JSON.stringify(lucidChartResponse, null, 2).substring(0, 200) + '...'
      );

      if (lucidChartResponse.functionCall && lucidChartResponse.functionCall.arguments) {
        try {
            const parsedResponse = JSON.parse(lucidChartResponse.functionCall.arguments);
            const adjustedResponse = adjustSwimlaneDimensions(parsedResponse);
            const fixedResponse = fixLucidChartData(adjustedResponse);
            console.log('Fixed Lucid Chart Data:', JSON.stringify(fixedResponse, null, 2)?.substring(0, 200) || "undefined");
            return fixedResponse;
        } catch (error) {
            console.error('Error parsing, adjusting, or fixing OpenAI response:', error);
            throw new Error(`Failed to process OpenAI response: ${error.message}`);
        }
      } else {
          console.error('Invalid OpenAI response structure:', lucidChartResponse);
          throw new Error("Invalid response from OpenAI for Lucid chart generation");
      }
}


function fixLucidChartData(chartData) {
    const validShapeTypes = ['swimLanes', 'rectangle'];
    const validFillTypes = ['solid'];
  
    function traverseAndFix(obj, parent = null) {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }
  
      if (Array.isArray(obj)) {
        return obj.map(item => traverseAndFix(item, parent));
      }
  
      const newObj = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'shapes') {
          newObj[key] = value.map(shape => traverseAndFix(shape, 'shapes'));
        } else if (parent === 'shapes' && key === 'type') {
          // This is a shape type
          newObj[key] = value.toLowerCase() === 'swimlanes' ? 'swimLanes' : 'rectangle';
        } else if (key === 'fill' && typeof value === 'object') {
          // This is a fill object
          newObj[key] = traverseAndFix(value, 'fill');
        } else if (parent === 'fill' && key === 'type') {
          // This is a fill type
          newObj[key] = 'color';
        } else if (key === 'type' && value === 'shapeEndpoint' && obj.shapeId) {
          // This is for endpoints in connectors
          newObj[key] = 'shapeEndpoint';
        } else {
          newObj[key] = traverseAndFix(value, key);
        }
      }
      return newObj;
    }
  
    const fixedData = traverseAndFix(chartData);
    console.log('Fixed Lucid Chart Data:', JSON.stringify(fixedData, null, 2).substring(0, 200) + '...');
    return fixedData;
  }

  function adjustSwimlaneDimensions(chartData) {
    const swimlane = chartData.pages[0].shapes.find(shape => shape.type === "swimLanes");
    if (!swimlane) {
        console.warn("No swimlane found in the chart data");
        return chartData;
    }
  
    const totalHeight = swimlane.boundingBox.h;
    let sumOfLaneWidths = 0;
    swimlane.lanes.forEach(lane => {
        sumOfLaneWidths += lane.width;
    });
  
    if (Math.abs(sumOfLaneWidths - totalHeight) > 0.01) {
        console.log(`Adjusting swimlane heights. Current sum: ${sumOfLaneWidths}, Expected: ${totalHeight}`);
        
        // Adjust lane widths proportionally
        const scaleFactor = totalHeight / sumOfLaneWidths;
        swimlane.lanes.forEach((lane, index) => {
            if (index === swimlane.lanes.length - 1) {
                // Make the last lane fill the remaining height
                lane.width = totalHeight - swimlane.lanes.reduce((sum, l, i) => i === index ? sum : sum + l.width, 0);
            } else {
                lane.width = Math.floor(lane.width * scaleFactor);
            }
        });
  
        console.log(`Swimlane heights adjusted. New sum: ${swimlane.lanes.reduce((sum, lane) => sum + lane.width, 0)}`);
    }
  
    // Adjust shape positions if necessary
    chartData.pages[0].shapes.forEach(shape => {
        if (shape.type !== "swimLanes" && shape.laneId) {
            const lane = swimlane.lanes.find(l => l.id === shape.laneId);
            if (lane) {
                const laneStartY = swimlane.lanes.slice(0, swimlane.lanes.indexOf(lane)).reduce((sum, l) => sum + l.width, 0);
                shape.boundingBox.y = Math.max(laneStartY, Math.min(shape.boundingBox.y, laneStartY + lane.width - shape.boundingBox.h));
            }
        }
    });
  
    return chartData;
  }
  

module.exports = { generateLucidChartData };