import axios from "axios";
import { z } from "zod";

export class AIFeatureUnavailableError extends Error {
  constructor() {
    super("AI_BASE_URL and AI_MODEL are not yet configured");
    this.name = "AIFeatureUnavailableError";
  }
}

export class AIBadResponseError extends Error {
  constructor() {
    super("The AI API returned a bad response");
    this.name = "AIBadResponseError";
  }
}

type ChatMessage = {
    role: "system" | "user" | "assistant";
    content: string;
}

type ChatCompletionResponse = {
    choices?: {message?: {content?:string | null}}[];
}

function getSettings(): {baseURL: string, model: string, apiKey?: string} {
    const baseURL = process.env.AI_BASE_URL;
    const model = process.env.AI_MODEL;

    if (!baseURL || !model) {
        throw new AIFeatureUnavailableError();
    }

    return {baseURL, model, apiKey:process.env.AI_API_KEY || undefined};
}

async function chat(messages:ChatMessage[]): Promise<string> {
    const {baseURL, model, apiKey} = getSettings();

    const { data } = await axios.post<ChatCompletionResponse>(
        `${baseURL.replace(/\/+$/,"")}/chat/completions`,
        {model, messages, temperature: 0.3},
        {
            timeout: 20_000,
            headers: apiKey ? {Authorization: `Bearer ${apiKey}`} : undefined,
        }
    );

    return data.choices?.[0]?.message?.content ?? "";
}

const SubtaskSuggestions = z.object({
    subtasks: z.array(z.string().trim().min(1)).min(1),
})

// helper function
function extractJson(text: string): unknown {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
        throw new AIBadResponseError();
    }

    // hahanapin yung text tapos irereturn as json format
    return JSON.parse(text.slice(start, end + 1));  
}

// helper function para yung subtasks na ibabalik is gagawing array
function parseSubtask(text: string): string[] {
    return SubtaskSuggestions.parse(extractJson(text)).subtasks.slice(0, 6);
}

// mismong prompt
export async function generateSubtaskSuggestions(topic:string, groupSubject:string): Promise<string[]> {
    getSettings(); // para ma-check kung available yung AI feature

    const prompt: ChatMessage[] = [
        {
            role: "system",
            content: 
                "You are a helpful study assistant for a student study-group app. " +
                "Given a broad task or topic, break it into 3 to 6 concise, " +
                "concrete, actionable subtasks a study group could each check " +
                "off individually. Keep each subtask under 12 words. Do not " +
            'include numbering. Reply with ONLY a JSON object like {"subtasks": ' +
            '["first subtask", "second subtask"]} and nothing else.',
        },
        {
            role: "user",
            content: `Study group subject: ${groupSubject}\nTask to break down: ${topic}`,
        }
    ];

    for(let attempt=1; attempt<=2;attempt++){
        const text = await chat(prompt);

        try {
            return parseSubtask(text);
        } catch {
            prompt.push(
                {role: "assistant", content: text},
                {
                    role: "user",
                    content: `The JSON you returned was invalid. Reply with ONLY a JSON object like " +
                        "{"subtask": ["first subtask", "second subtask"]} and nothing else.`,
                }
            );
        }
    }
    throw new AIBadResponseError();
}