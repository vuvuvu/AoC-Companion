import { GoogleGenAI, Chat } from "@google/genai";
import { HintLevel, AppState } from '../types';

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

const getSystemInstruction = (state: AppState): string => {
  return `
    You are an expert Computer Science tutor specialized in Advent of Code (AoC) puzzles. 
    Your specific task is to help the user with Day ${state.day} of the year ${state.year}.
    The puzzle is located at: https://adventofcode.com/${state.year}/day/${state.day}
    
    The user is coding in ${state.language}.
    
    CRITICAL RULES:
    1. NEVER solve the problem for the user. Do not generate the final answer string or number.
    2. NEVER provide the full working solution code unless it is a generic snippet unrelated to the specific puzzle input.
    3. Adapt strictly to the requested Hint Level: "${state.hintLevel}".
       - Vague Hint: Give a nudge about the problem statement, edge cases, or general direction.
       - Logic/Algorithm: Discuss data structures (arrays, maps, trees) and algorithms (BFS, sliding window, simulation) suitable for the problem.
       - Pseudocode: Provide high-level steps without language-specific implementation details.
       - Debugging Help: If the user provides code, look for logic errors, off-by-one errors, or misunderstanding of the rules.
    4. Be encouraging but direct. If they are on the right track, let them know but direct if they are not. Always be constructive.
    5. VISUALIZATION: When explaining algorithms, data structures (like trees, graphs, grids), or logic flows, YOU MUST use Mermaid.js charts.
       - Use \`\`\`mermaid code blocks.
       - Keep charts simple and readable in dark mode.
       - CRITICAL SYNTAX RULES for Mermaid:
         * Always enclose node labels in double quotes. Example: A["Node Label (with parens)"]
         * Do not use special characters (like commas, brackets) inside labels unless quoted.
         * Ensure distinct lines for each statement. Do not combine multiple edge definitions on one line if complex.
       - Use flowcharts (graph TD/LR) for logic.
       - Use classDiagram for data structures if relevant.
       - Use sequenceDiagram for state changes if relevant.
    6. If the user provides their puzzle input, acknowledge it but do not process it to give the answer. Use it to understand the specific version of their problem if applicable.
    7. You have access to Google Search. If the user asks about the problem description and you don't have the context, you may use the tool to verify the problem details from the official URL.
    
    Current Puzzle Context provided by user:
    "${state.puzzleContext}"
  `;
};

export const initializeChat = async (state: AppState) => {
  try {
    if (!process.env.API_KEY) {
        throw new Error("API Key not found");
    }
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // We create the chat session
    chatSession = genAI.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: getSystemInstruction(state),
        temperature: 0.7,
        tools: [{ googleSearch: {} }],
      }
    });

    return true;
  } catch (error) {
    console.error("Failed to init chat:", error);
    return false;
  }
};

export const updateSystemContext = async (state: AppState) => {
    // Since we can't easily update system instruction mid-chat in a stateful way without restarting 
    // or sending a system message, we will send a system-style message to the model to update its behavior.
    if (!chatSession) return;
    
    const updatePrompt = `
      [SYSTEM UPDATE]
      Update your persona settings:
      Target Year: ${state.year}
      Target Day: ${state.day}
      User Language: ${state.language}
      Current Hint Level: ${state.hintLevel}
      
      Remember: Do NOT solve the problem. Guide the user.
      Use Mermaid charts for visualizations where helpful. Follow strict syntax rules (quote labels).
    `;
    
    await chatSession.sendMessage({ message: updatePrompt });
};

export const fetchPuzzleFromAoC = async (year: string, day: string): Promise<string> => {
    if (!process.env.API_KEY) return "API Key missing";

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = ai.models;
        
        const prompt = `
            Go to https://adventofcode.com/${year}/day/${day}.
            Read the puzzle description.
            Summarize the problem statement, the rules, and the goal for Part 1 clearly and concisely.
            Do NOT include the solution.
            If the page says the puzzle is not available yet, just return "Puzzle not available yet."
        `;

        const result = await model.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        
        return result.text || "Could not retrieve puzzle description.";
    } catch (error) {
        console.error("Error fetching puzzle:", error);
        return "Error fetching puzzle description from AoC.";
    }
}

export const sendMessageToGemini = async (userMessage: string): Promise<string> => {
  if (!chatSession) {
    throw new Error("Chat session not initialized");
  }

  try {
    const response = await chatSession.sendMessage({ message: userMessage });
    
    let text = response.text || "I couldn't generate a response. Please try again.";

    // Handle Grounding Metadata if present (from Google Search)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
      const sources = groundingChunks
        .map((chunk: any) => {
          if (chunk.web?.uri && chunk.web?.title) {
            return `[${chunk.web.title}](${chunk.web.uri})`;
          }
          return null;
        })
        .filter(Boolean);

      if (sources.length > 0) {
        text += `\n\n**Sources:**\n${sources.map((s: string) => `- ${s}`).join('\n')}`;
      }
    }

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error communicating with the AI. Please check your connection or API key.";
  }
};