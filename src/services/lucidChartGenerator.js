// File: src/services/lucidChartGenerator.js
// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.

const openAIService = require('./openAIService');

async function generateLucidChartData(processDescription) {
    console.log('Generating Lucid chart data...');
    //console.log('Process Description:', processDescription.substring(0, 200));
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
    - Ensure that the x and y positions for each shape in the swimlane are calculated to prevent overlapping:
    - Horizontally, space shapes evenly by using lane width divided by the total number of shapes. Center single shapes in their lane.
    - Vertically, start shapes at 10%  of the lane height (stated in pixels), with each subsequent shape placed at y = previousY + shapeHeight + padding.
    - Ensure that shapes in sparse lanes are centered vertically.

     - laneId: ID of the lane this shape belongs to
     - style: { 
         stroke: { color: "#000000", width: 2 },
         fill: { 
           type: "color",
           color: "#FFFFFF" 
         }
       }
     - text: Label or content within the shape (use black text color)

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
            - **Source Shape ("endpoint1")**: Connect from the **right center**.
            - "position": "{ "x": 0.5, "y": 1 }"
            - **Target Shape ("endpoint2")**: Connect to the **left center**.
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
            const finalResponse = adjustShapePositions(fixedResponse); // Call the new function here
            console.log('Final Lucid Chart Data:', JSON.stringify(finalResponse, null, 2)?.substring(0, 200) || "undefined");
            return finalResponse;
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
  
// New function to adjust shape positions within lanes
function adjustShapePositions(chartData) {
    const swimlane = chartData.pages[0].shapes.find(shape => shape.type === "swimLanes");
    if (!swimlane) {
        console.warn("No swimlane found in the chart data");
        return chartData;
    }

    const swimlaneX = swimlane.boundingBox.x;
    const swimlaneY = swimlane.boundingBox.y;
    const swimlaneWidth = swimlane.boundingBox.w;
    const swimlaneHeight = swimlane.boundingBox.h;

    // When vertical: false, titleBar.height represents width
    const titleBarWidth = swimlane.titleBar && swimlane.titleBar.height ? swimlane.titleBar.height : 0;

    const padding = 10; // Adjust as needed
    const MIN_WIDTH = 50; // Minimum width in pixels
    const MIN_HEIGHT = 30; // Minimum height in pixels

    console.log(`Swimlane X: ${swimlaneX}, Y: ${swimlaneY}, Width: ${swimlaneWidth}, Height: ${swimlaneHeight}`);
    console.log(`Title Bar Width: ${titleBarWidth}`);
    console.log(`Padding: ${padding}`);

    // Calculate the cumulative Y positions for each lane
    let laneStartYPositions = [];
    let cumulativeY = swimlaneY;
    swimlane.lanes.forEach((lane, index) => {
        laneStartYPositions.push(cumulativeY);
        console.log(`Lane ${index + 1} (${lane.id}) starts at Y: ${cumulativeY}, Height: ${lane.width}`);
        cumulativeY += lane.width; // Since vertical: false, lane.width represents height
    });

    // Group shapes by lane
    const lanesWithShapes = swimlane.lanes.map(lane => {
        const shapesInLane = chartData.pages[0].shapes.filter(shape => shape.laneId === lane.id && shape.type !== "swimLanes");
        return { lane, shapes: shapesInLane };
    });

    // Adjust shapes within each lane
    lanesWithShapes.forEach(({ lane, shapes }) => {
        const laneStartY = laneStartYPositions[swimlane.lanes.findIndex(l => l.id === lane.id)];
        const laneHeight = lane.width; // Height of the lane

        const availableWidth = swimlaneWidth - titleBarWidth - 2 * padding;
        const availableXStart = swimlaneX + titleBarWidth + padding;

        const numberOfShapes = shapes.length;
        if (numberOfShapes === 0) return; // No shapes to adjust

        // Calculate total shapes width
        const totalShapesWidth = shapes.reduce((sum, shape) => {
            if (shape.boundingBox.w <= 1 && shape.boundingBox.h <= 1) {
                // If width is fractional, convert to absolute
                return sum + (shape.boundingBox.w * availableWidth);
            } else {
                return sum + shape.boundingBox.w;
            }
        }, 0);

        // Calculate total spacing
        let spacing = (availableWidth - totalShapesWidth) / (numberOfShapes + 1);

        // If spacing is negative, set to zero and warn
        if (spacing < 0) {
            console.warn(`Lane ${lane.id} has more shapes or larger shapes than available width. Setting spacing to 0.`);
            spacing = 0;
        }

        console.log(`\nProcessing Lane (${lane.id}):`);
        console.log(`Total Shapes Width: ${totalShapesWidth.toFixed(2)} pixels`);
        console.log(`Calculated Spacing: ${spacing.toFixed(2)} pixels`);

        // Initialize currentX
        let currentX = availableXStart + spacing;

        shapes.forEach(shape => {
            console.log(`\nAdjusting shape ${shape.id} in lane ${lane.id}`);
            console.log(`Original Bounding Box:`, shape.boundingBox);

            // Extract bounding box properties
            let { x: fractionalX, y: originalY, w: shapeWidth, h: shapeHeight } = shape.boundingBox;

            // Convert fractional w and h to absolute sizes if necessary
            if (shapeWidth <= 1 && shapeHeight <= 1) {
                // Assuming w and h are fractions, convert to absolute units
                shapeWidth = shapeWidth * availableWidth;
                shapeHeight = shapeHeight * (laneHeight - 2 * padding);
                console.log(`Converted shape dimensions to absolute units: Width=${shapeWidth.toFixed(2)}, Height=${shapeHeight.toFixed(2)}`);
            } else {
                console.log(`Shape dimensions are already absolute: Width=${shapeWidth}, Height=${shapeHeight}`);
            }

            // Enforce minimum shape sizes
            if (shapeWidth < MIN_WIDTH) {
                console.warn(`Shape ${shape.id} width (${shapeWidth}) is below minimum. Adjusting to ${MIN_WIDTH}`);
                shapeWidth = MIN_WIDTH;
            }

            if (shapeHeight < MIN_HEIGHT) {
                console.warn(`Shape ${shape.id} height (${shapeHeight}) is below minimum. Adjusting to ${MIN_HEIGHT}`);
                shapeHeight = MIN_HEIGHT;
            }

            // Determine if y is fractional or absolute
            let absoluteY;
            if (originalY <= 1) {
                // y is fractional, convert to absolute position within the lane
                const availableHeight = laneHeight - 2 * padding - shapeHeight;
                absoluteY = laneStartY + padding + (originalY * availableHeight);
                console.log(`y is fractional (${originalY}). Converted to absolute Y: ${absoluteY.toFixed(2)}`);
            } else {
                // y is absolute, ensure it falls within lane boundaries
                absoluteY = originalY;

                // Calculate lane boundaries
                const laneEndY = laneStartY + laneHeight;
                const minY = laneStartY + padding;
                const maxY = laneEndY - padding - shapeHeight;

                // Adjust y if out of bounds
                if (absoluteY < minY) {
                    console.warn(`Shape ${shape.id} Y (${absoluteY}) is below minimum Y (${minY}). Adjusting to ${minY}`);
                    absoluteY = minY;
                } else if (absoluteY > maxY) {
                    console.warn(`Shape ${shape.id} Y (${absoluteY}) is above maximum Y (${maxY}). Adjusting to ${maxY}`);
                    absoluteY = maxY;
                } else {
                    console.log(`y is absolute and within lane boundaries: ${absoluteY}`);
                }
            }

            // Assign x position based on spacing
            const absoluteX = Math.round(currentX);
            const roundedY = Math.round(absoluteY);
            const roundedWidth = Math.round(shapeWidth);
            const roundedHeight = Math.round(shapeHeight);

            // Ensure that x + w does not exceed availableWidth
            if ((absoluteX + roundedWidth) > (availableXStart + availableWidth)) {
                console.warn(`Shape ${shape.id} x (${absoluteX}) + w (${roundedWidth}) exceeds available width (${availableXStart + availableWidth}). Adjusting x to fit.`);
                const maxX = availableXStart + availableWidth - roundedWidth;
                shape.boundingBox.x = Math.round(maxX);
                shape.boundingBox.y = roundedY;
                shape.boundingBox.w = roundedWidth;
                shape.boundingBox.h = roundedHeight;
                console.log(`Adjusted Bounding Box:`, shape.boundingBox);
            } else {
                console.log(`Assigned absolute X: ${absoluteX}, absolute Y: ${roundedY}`);
                // Update the bounding box
                shape.boundingBox.x = absoluteX;
                shape.boundingBox.y = roundedY;
                shape.boundingBox.w = roundedWidth;
                shape.boundingBox.h = roundedHeight;
                console.log(`Adjusted Bounding Box:`, shape.boundingBox);
            }

            // Update currentX for the next shape
            currentX += shapeWidth + spacing;
        });
    });

    return chartData;
}


module.exports = { generateLucidChartData };