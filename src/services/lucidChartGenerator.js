// File: src/services/lucidChartGenerator.js
// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.

const openAIService = require('./openAIService');

async function generateLucidChartData(processDescription) {
    console.log('Generating Lucid chart data...');
    console.log('Process Description:', processDescription);

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
     - shapes: Array of shape objects (including one swimlane).
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
       - title: HTML string for the lane title (e.g., "<span style='color: #FFFFFF; font-weight: bold;'>Phase Name</span>")
       - width: Width of the lane (ensure sum of all widths equals the total width of the swimlane)
       - headerFill: Color for the lane header (use only colors from the valid color list below)
       - laneFill: Color for the lane body (use only colors from the valid color list below)

3. Adding Shapes to Swimlanes:
   - Create shape objects for each step in the process:
     - id: Unique identifier for the shape (e.g., "shape1", "shape2", etc.)
     - type: Use only the following valid shape types: rectangle, diamond, ellipse, triangle, hexagon, octagon, cloud, document, cylinder
     - boundingBox: { x: [position within lane], y: [vertical position], w: 200, h: 80 }
     - laneId: ID of the lane this shape belongs to
     - style: { 
         stroke: { color: [use only colors from the valid color list], width: 2 },
         fill: { 
           type: [use only valid fill types listed below], 
           color: [use only colors from the valid color list] 
         }
       }
     - text: Label or content within the shape

4. Connecting Shapes with Lines:
   - Create line objects to connect the shapes:
     - id: Unique identifier for the connector (e.g., "connector1", "connector2", etc.)
     - lineType: "straight" or "curved" (prefer "straight" for simplicity)
     - stroke: { color: [use only colors from the valid color list], width: 2 }
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

Valid Color List:
Use only these colors for all color properties in the chart:
"#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF", "#C0C0C0", "#808080", "#800000", "#808000", "#008000", "#800080", "#008080", "#000080"

Valid Fill Types:
Use only these fill types for shape fills:
"solid", "transparent", "gradient"

IMPORTANT: 
- Ensure that the swimlane object contains the 'vertical' property set to false, and the 'lanes' property with an array of lane objects. 
- The sum of all lane widths must exactly equal the total width of the swimlane (800 in this case).
- Use only the specified valid shape types, colors, and fill types.

Generate a complete JSON structure that accurately represents the SAP implementation process described earlier, following these guidelines strictly. Ensure all IDs are unique and the structure is valid according to the Lucid API specifications.
`;


    console.log('Lucid Chart Prompt:', lucidChartPrompt);

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

    console.log('OpenAI Response for Lucid Chart:', JSON.stringify(lucidChartResponse, null, 2));

    if (lucidChartResponse.functionCall && lucidChartResponse.functionCall.arguments) {
      try {
          const parsedResponse = JSON.parse(lucidChartResponse.functionCall.arguments);
          const adjustedResponse = adjustSwimlaneDimensions(parsedResponse);
          console.log('Adjusted Lucid Chart Data:', JSON.stringify(adjustedResponse, null, 2));
          return adjustedResponse;
      } catch (error) {
          console.error('Error parsing or adjusting OpenAI response:', error);
          throw new Error(`Failed to parse or adjust OpenAI response: ${error.message}`);
      }
  } else {
      console.error('Invalid OpenAI response structure:', lucidChartResponse);
      throw new Error("Invalid response from OpenAI for Lucid chart generation");
  }
}

function adjustSwimlaneDimensions(chartData) {
  const swimlane = chartData.pages[0].shapes.find(shape => shape.type === "swimLanes");
  if (!swimlane) {
      console.warn("No swimlane found in the chart data");
      return chartData;
  }

  const totalWidth = swimlane.boundingBox.w;
  let sumOfLaneWidths = 0;
  swimlane.lanes.forEach(lane => {
      sumOfLaneWidths += lane.width;
  });

  if (Math.abs(sumOfLaneWidths - totalWidth) > 0.01) {
      console.log(`Adjusting swimlane widths. Current sum: ${sumOfLaneWidths}, Expected: ${totalWidth}`);
      
      // Adjust lane widths proportionally
      const scaleFactor = totalWidth / sumOfLaneWidths;
      swimlane.lanes.forEach((lane, index) => {
          if (index === swimlane.lanes.length - 1) {
              // Make the last lane fill the remaining width
              lane.width = totalWidth - swimlane.lanes.reduce((sum, l, i) => i === index ? sum : sum + l.width, 0);
          } else {
              lane.width = Math.floor(lane.width * scaleFactor);
          }
      });

      console.log(`Swimlane widths adjusted. New sum: ${swimlane.lanes.reduce((sum, lane) => sum + lane.width, 0)}`);
  }

  // Adjust shape positions if necessary
  chartData.pages[0].shapes.forEach(shape => {
      if (shape.type !== "swimLanes" && shape.laneId) {
          const lane = swimlane.lanes.find(l => l.id === shape.laneId);
          if (lane) {
              const laneStartX = swimlane.lanes.slice(0, swimlane.lanes.indexOf(lane)).reduce((sum, l) => sum + l.width, 0);
              shape.boundingBox.x = Math.max(laneStartX, Math.min(shape.boundingBox.x, laneStartX + lane.width - shape.boundingBox.w));
          }
      }
  });

  return chartData;
}

module.exports = { generateLucidChartData };