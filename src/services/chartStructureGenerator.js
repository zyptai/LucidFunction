// File: src/services/chartStructureGenerator.js
// Copyright (c) 2024 ZyptAI, tim.barrow@zyptai.com
// This software is proprietary to ZyptAI.

// Service for generating chart structure descriptions for SAP implementation processes

const openAIService = require('./openAIService');

/**
 * Generates a detailed chart structure description based on user prompt
 * @param {string} userPrompt - The user's input prompt
 * @returns {Object} Object containing enhancedPrompt and processDescription
 */
async function generateChartStructureDescription(userPrompt) {
    console.log('Generating chart structure description...');

const chartStructurePrompt = `Based on the following user request, generate a detailed list of objects that would go into a swimlane process flow:

User Request: ${userPrompt}

### Step 1: Detailed Process Summary
Provide a detailed summary of the business process that the chart is intended to represent. The summary should include all major actions, decision points, and escalations that need to be shown in the diagram.
Focus on the following elements to ensure the summary is specific enough to inform the diagram creation:
- The flow of actions and interactions between different roles, systems, or departments.
- Key decision points, especially where processes might branch or require additional handling (e.g., errors, stock issues, payment failures).
- Escalation points where issues may require involvement from other departments or roles.
- Feedback loops where customer feedback or process improvements are involved.

### Step 2: Swimlane Description
Create a comprehensive list to represent the process in a swimlane diagram, ensuring that:

#### Swimlanes:
- All actors (e.g., systems, departments, roles, customers) involved in the process are listed.
- Each swimlane is named specifically based on its function in the process.
- Provide a total count of swimlanes.

#### Process Steps and Shapes:
- For each step in the process, define the shape using standard flowchart notation (e.g., rectangles for actions, diamonds for decision points).
- Include text for each shape describing the action or decision it represents.
- Number the process steps sequentially and use letters for concurrent steps (e.g., "Process Step 1", "Process Step 2a", "Process Step 2b").
- Indicate the swimlane for each step to show which role or system is responsible.

- **Positioning:**
  - **Determine Positions:**
    - Analyze the entire process flow across all swimlanes to determine the logical sequence of steps.
    - Aim for 5 to 8 positions for most charts, considering the overall process complexity.  Charts with less than 5 shapes can have a position per shape.
    - Assign each shape a unique "position" number based on its place in the logical sequence, not just within its lane.
  - **Position Distribution:**
    - Ensure positions reflect the logical flow of the process across all swimlanes.
    - Aim to use all available positions (5 to 8) to spread out the shapes evenly.
    - No more than 25% of the total shapes should be in a single position.
    - If there are 5 or fewer shapes in total, each shape should have a unique position.
  - **Cross-Lane Positioning:**
    - Consider dependencies between shapes in different lanes when assigning positions.
    - A shape's position should generally be greater than or equal to the positions of its predecessors, even if they are in different lanes.
  - **Ensure Balanced Distribution:**
    - Position "1" should correspond to the leftmost placement within the chart.
    - The highest position number should correspond to the rightmost placement.
    - Distribute shapes evenly across the available positions.
  - **Logical Flow:**
    1. Steps that are directly connected should have consecutive or nearby position numbers when possible.
    2. If a step has multiple predecessors, its position number should be greater than the highest position number among its predecessors.
    3. Steps without predecessors should start at lower positions in their respective lanes, but not necessarily all at position 1.
    4. Position numbers should generally increase from left to right in the overall process flow.
  - **Avoid Overcrowding:**
    - If multiple shapes could logically share the same position, consider spreading them to adjacent positions for better visual clarity.
    - For parallel processes or decisions, use adjacent positions rather than the same position.
  - **Handling Complex Flows:**
    - For processes with many parallel or branching paths, prioritize clarity of flow over strict adherence to left-to-right progression.
    - Use positions strategically to show relationships between steps across different swimlanes.
  
    - **Logical Flow:**
    1. Ensure that predecessor steps always have position numbers less than or equal to their successors.
    2. Steps that are directly connected should have consecutive or nearby position numbers when possible.
    3. If a step has multiple predecessors, its position number should be greater than the highest position number among its predecessors.
    4. Steps without predecessors should start at lower positions (but not necessarily all at position 1) in their respective lanes.
    5. Position numbers should generally increase from left to right in the process flow.
  - **Avoid Overcrowding:**
    - If multiple shapes in a lane could logically share the same position, consider spreading them to adjacent positions for better visual clarity.
    - For parallel processes or decisions, use adjacent positions rather than the same position.
  - **Handling Complex Flows:**
    - For processes with many parallel or branching paths, prioritize clarity of flow over strict adherence to left-to-right progression.
    - Use positions strategically to show relationships between steps across different swimlanes.

#### Line Connectors:
- Describe how each step connects to the next using line connectors.
- For each connector, specify:
  - The starting and ending shapes.
  - The total number of line connectors used.

### Step 3: Process Flow Clarifications
Additionally, make sure to:
- Include error handling and escalation steps where applicable (e.g., handling process failures, exceptions, or delays).
- Account for feedback loops or any customer communication.
- Capture points where system updates or logs occur (e.g., order management system logs, CRM updates).
- The description should be specific enough to create a swimlane diagram in any flowchart tool like Lucidchart, Visio, or similar tools.`;

    

    const response = await openAIService.getOpenAIResponse(
        [{ role: "user", content: chartStructurePrompt }]
    );

    console.log('OpenAI response received.');

    let processDescription;
    if (response.function_call && response.function_call.arguments) {
        const result = JSON.parse(response.function_call.arguments);
        processDescription = result.processDescription;
    } else if (response.content) {
        processDescription = response.content;
    } else {
        console.error('Unexpected response format from OpenAI');
        throw new Error('Invalid process description received from OpenAI');
    }

    console.log('Process description generated successfully.');

    // Combine the original user prompt with the chart structure prompt for embedding
    const enhancedPrompt = `${userPrompt}\n\n${chartStructurePrompt}`;

    return { enhancedPrompt, processDescription };
}

module.exports = { generateChartStructureDescription };