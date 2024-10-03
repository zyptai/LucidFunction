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
     - shapes: Array of shape objects (including one swimlane and process step shapes).
     - lines: Array of line (connector) objects.

2. Defining Swimlane:
   - Create a single swimlane object with the following properties:
     - id: "mainSwimlane"
     - type: "swimLanes"
     - boundingBox: { x: 100, y: 100, w: 800, h: 600 }
     - style: { stroke: { color: "#000000", width: 2 } }
     - magnetize: true
     - vertical: false (IMPORTANT: Include this property)
     - titleBar: { height: 40, verticalText: false }
     - lanes: Array of lane objects (create one for each main phase or system in the process)
       - id: Unique identifier for each lane (e.g., "lane1", "lane2", etc.)
       - title: HTML string for the lane title (e.g., "<span style='color: #000000; font-weight: bold;'>Lane Title</span>")
       - width: Width of the lane (ensure sum of all widths equals the total width of the swimlane)
       - headerFill: Use alternating shades of grey (e.g., "#E0E0E0", "#C0C0C0")
       - laneFill: "#FFFFFF" (white) for all lanes

3. Adding Shapes to Swimlanes:
   - Create shape objects for each step in the process:
     - id: Unique identifier for the shape (e.g., "shape1", "shape2", etc.)
     - type: Use only the following valid shape types: circle, cloud, cross, indent, diamond, doubleArrow, flexiblePolygon, hexagon,
             isoscelesTriangle, octagon, pentagon, polyStar, polyStarShape, rectangle, rightTriangle, singleArrow, singleArrow
     - boundingBox: { x: [position within lane], y: [vertical position], w: 160, h: 60 }
     - laneId: ID of the lane this shape belongs to
     - style: { 
         stroke: { color: "#000000", width: 2 },
         fill: { 
           type: "color",
           color: "#FFFFFF" 
         }
       }
     - text: Label or content within the shape (use black text color)
       IMPORTANT: Include the position information in the text using the following format:
       "[Position:X] Original Text"
       Where X is the position number of the shape within its lane.
       Example: "[Position:2] Verify Order"

4. Connecting Shapes with Lines:
   - Create line objects to connect the shapes:
     - id: Unique identifier for the connector (e.g., "line1", "line2", etc.)
     - lineType: Use ONLY "straight" for all lines
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
    The valid endpoint types for Lucidchart are: 
        "shapeEndpoint" - This is the most common type, used to connect lines to shapes.
        "connectionPoint" - Used for specific connection points on shapes.
        "floatingEndpoint" - Used for endpoints that are not connected to any shape.
    - **Endpoint Positioning Rules:**
        1. **Different Lanes (Source in Higher Lane than Target):**
            - **Source Shape ("endpoint1")**: Connect from the **bottom center**.
            - "position": "{ "x": 1, "y": 0.5 }"
            - **Target Shape ("endpoint2")**: Connect to the **top center**.
            - "position": "{ "x": 0, "y": 0.5 }"
  
        2. **Same Lane (Source Shape is Earlier in Process than Target):**
            - **Source Shape ("endpoint1")**: Connect from the **left center**.
            - "position": "{ "x": 0.5, "y": 1 }"
            - **Target Shape ("endpoint2")**: Connect to the **right center**.
            - "position": "{ "x": 0.5, "y": 0 }"
        
   IMPORTANT: Use ONLY the specified values for lineType, endpoint styles, endpoint types, shape types.
   
   IMPORTANT: The 'position' property for both endpoints MUST use decimal values between 0 and 1 (inclusive) for both x and y coordinates.
   These values represent relative positions on the shape:
     - x: 0 (left edge), 0.5 (center), 1 (right edge)
     - y: 0 (top edge), 0.5 (middle), 1 (bottom edge)

5. Styling and Positioning:
   - Use consistent colors and stroke widths throughout the chart.
   - Position shapes within their respective lanes, maintaining clear flow:
     * Horizontally: If only one shape in a lane, center it. If multiple shapes, space them evenly.
     * Vertically: Start first shape at y: (10% from top) and space subsequent shapes evenly, ensuring they don't overlap.
   - Ensure that shapes do not overlap and are evenly spaced within lanes.
   - If a lane has fewer shapes than others, distribute its shapes evenly across the lane height.

IMPORTANT: 
- All numeric values for positions and sizes should be expressed as decimals between 0 and 1, representing fractions of the total width or height.
- The sum of all lane widths must equal exactly 1.0.
- Use only the specified valid shape types and line types.
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
                                    text: { type: "string", 
                                    pattern: "^\\[Position:\\d+\\]\\s.*$" },
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
            let parsedResponse = JSON.parse(lucidChartResponse.functionCall.arguments);
            parsedResponse = adjustSwimlaneDimensions(parsedResponse);
            parsedResponse = fixLucidChartData(parsedResponse);
            parsedResponse = adjustShapePositions(parsedResponse);
            parsedResponse = adjustConnections(parsedResponse);
            console.log('Final Lucid Chart Data:', JSON.stringify(parsedResponse, null, 2)?.substring(0, 200) || "undefined");
            return parsedResponse;
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
    const validShapeTypes = [ 'circle', 'cloud', 'cross', 'diamond', 'doubleArrow', 'flexiblePolygon', 'hexagon', 
        'isoscelesTriangle', 'octagon', 'pentagon', 'polyStar', 'rectangle', 'rightTriangle', 'singleArrow', 'swimLanes'];
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
          newObj[key] = (value.toLowerCase() === 'swimlane' || value === 'swimLanes') 
          ? 'swimLanes' 
          : validShapeTypes.includes(value) ? value : 'rectangle';
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
  
// File: src/services/lucidChartGenerator.js
// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.

function adjustShapePositions(chartData) {
    const swimlane = chartData.pages[0].shapes.find(shape => shape.type === "swimLanes");
    if (!swimlane) {
        console.warn("No swimlane found in the chart data");
        return chartData;
    }

    const shapes = chartData.pages[0].shapes.filter(shape => shape.type !== "swimLanes");
    
    // Calculate the number of unique positions
    const positions = new Set(shapes.map(shape => {
        const match = shape.text.match(/\[Position:(\d+)\]/);
        return match ? parseInt(match[1]) : 0;
    }));
    const numPositions = Math.max(...positions);

    // Define constants
    const DEFAULT_WIDTH = 800;
    const MIN_POSITIONS = 4;
    const SHAPE_WIDTH = 160;
    const SHAPE_HEIGHT = 60;
    const SHAPE_BUFFER = 40;

    // Calculate new swimlane width
    let swimlaneWidth = DEFAULT_WIDTH;
    if (numPositions > MIN_POSITIONS) {
        swimlaneWidth = (SHAPE_WIDTH + SHAPE_BUFFER) * numPositions;
    }

    // Update swimlane bounding box width
    swimlane.boundingBox.w = swimlaneWidth;

    // Calculate swimlane height based on sum of lane widths
    const swimlaneHeight = swimlane.lanes.reduce((sum, lane) => sum + lane.width, 0);
    swimlane.boundingBox.h = swimlaneHeight;

    // Calculate the maximum width of swimlane titles
    const maxTitleWidth = Math.max(...swimlane.lanes.map(lane => {
        const titleText = lane.title.match(/>([^<]+)</)[1];
        return titleText.length * 8; // Assuming 8 pixels per character on average
    }));

    // Adjust shapes
    let currentY = swimlane.boundingBox.y;
    swimlane.lanes.forEach((lane) => {
        const shapesInLane = shapes.filter(shape => shape.laneId === lane.id);
        shapesInLane.forEach((shape) => {
            const match = shape.text.match(/\[Position:(\d+)\]/);
            if (match) {
                const position = parseInt(match[1]);

                // Calculate new x position
                const newX = swimlane.boundingBox.x + maxTitleWidth + 
                             (position - 1) * (SHAPE_WIDTH + SHAPE_BUFFER);

                // Calculate new y position
                const newY = currentY + (lane.width - SHAPE_HEIGHT) / 2;

                // Update shape
                shape.boundingBox.x = Math.round(newX);
                shape.boundingBox.y = Math.round(newY);
                shape.boundingBox.w = SHAPE_WIDTH;
                shape.boundingBox.h = SHAPE_HEIGHT;

                // Remove position indicator from shape text
                shape.text = shape.text.replace(/\[Position:\d+\]\s*/, "");
            }
        });
        currentY += lane.width;
    });

    console.log(`Swimlane dimensions adjusted to ${swimlaneWidth}x${swimlaneHeight}. Shapes repositioned accordingly.`);
    return chartData;
}

function adjustConnections(chartData) {
    const swimlane = chartData.pages[0].shapes.find(shape => shape.type === "swimLanes");
    const shapes = chartData.pages[0].shapes.filter(shape => shape.type !== "swimLanes");
    
    chartData.pages[0].lines.forEach(line => {
        const sourceShape = shapes.find(shape => shape.id === line.endpoint1.shapeId);
        const targetShape = shapes.find(shape => shape.id === line.endpoint2.shapeId);
        
        if (sourceShape && targetShape) {
            const sourceLane = swimlane.lanes.findIndex(lane => lane.id === sourceShape.laneId);
            const targetLane = swimlane.lanes.findIndex(lane => lane.id === targetShape.laneId);
            
            if (sourceLane < targetLane) {
                // Different lanes, source in higher lane
                line.endpoint1.position = { x: 0.5, y: 1 };  // bottom center
                line.endpoint2.position = { x: 0.5, y: 0 };  // top center
            } else if (sourceLane === targetLane) {
                // Same lane
                line.endpoint1.position = { x: 1, y: 0.5 };  // right center
                line.endpoint2.position = { x: 0, y: 0.5 };  // left center
            } else {
                console.warn(`Unexpected lane order: ${sourceLane} to ${targetLane}`);
                line.endpoint1.position = { x: 0.5, y: 0 };  // top center
                line.endpoint2.position = { x: 0.5, y: 1 };  // bottom center
            }
        } else {
            console.warn(`Could not find shapes for connection: ${line.id}`);
            // Remove the invalid connection
            const index = chartData.pages[0].lines.indexOf(line);
            if (index > -1) {
                chartData.pages[0].lines.splice(index, 1);
            }
        }
    });

    return chartData;
}

module.exports = { generateLucidChartData };