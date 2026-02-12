import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const deepseek = axios.create({
    baseURL: "https://api.deepseek.com/v1",
    headers: {
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json"
    }
});

const STRONG_PARAPHRASE_PROMPT = `
You are an advanced paraphrasing engine.

Completely rewrite the given text while preserving its meaning.
Change sentence structure.
Use different vocabulary.
Reorganize phrases naturally.
Avoid copying sentence patterns.
Do NOT explain.
Do NOT summarize.
Return only the rewritten text.
`;

const CINEMATIC_PROMPT = `
You are a creative literary rewriting engine.

Rewrite the text in a cinematic, emotionally rich style.
Restructure sentences.
Enhance imagery.
Maintain the original meaning but change the wording significantly.
Do not copy sentence patterns.
Return only the rewritten version.
`;

const STANDARD_PROMPT = `
You are a professional paraphrasing engine.

Rewrite the given text clearly and naturally.
Keep the meaning exactly the same.
Do not answer questions.
Do not add explanations.
Return only the rewritten text.
`;

const FORMAL_PROMPT = `
You are a formal writing expert.

Rewrite the text in a highly professional and academic tone.
Use sophisticated vocabulary where appropriate.
Maintain the original meaning.
Do not add explanations.
Return only the rewritten text.
`;

const SIMPLE_PROMPT = `
You are a simplification engine.

Rewrite the text using simple, clear, and easy English.
Use short sentences.
Avoid complex words.
Keep the same meaning.
Return only the rewritten text.
`;

const FLUENCY_PROMPT = `
You are a fluency enhancement engine.

Improve clarity, grammar, and natural flow.
Keep the original meaning.
Make the sentence sound smooth and native.
Do not change the intent.
Return only the improved text.
`;

function getPromptByTone(tone) {
    switch (tone) {
        case "formal":
            return FORMAL_PROMPT;
        case "simple":
            return SIMPLE_PROMPT;
        case "fluency":
            return FLUENCY_PROMPT;
        case "creative": // Mapping "Cinematic" to "Creative" tone
            return CINEMATIC_PROMPT;
        default:
            return STANDARD_PROMPT;
    }
}

function getStrengthInstruction(strength) {
    if (strength === "strong") {
        return "\n\nCompletely restructure sentences and change phrasing significantly.";
    }
    if (strength === "medium") {
        return "\n\nRewrite sentences with noticeable vocabulary and structure changes.";
    }
    // "light"
    return "\n\nLightly improve wording and clarity.";
}

export async function paraphraseText(text, tone = "standard", strength = "medium") {
    // 🌡️ Adjust temperature based on tone and strength
    // Simple/Fluency = Lower temp (more deterministic)
    // Creative/Cinematic = High temp
    // Strong strength = Slightly higher temp to encourage variety

    let temperature = 0.7;

    if (tone === "creative") {
        temperature = 0.85;
    } else if (tone === "simple" || tone === "fluency") {
        temperature = 0.4;
    } else if (strength === "strong") {
        temperature = 0.75; // Boost slightly for strong rewrites
    }

    // Select Base Prompt
    let systemPrompt = getPromptByTone(tone);

    // If "Standard" tone but "Strong" strength, maybe switch to the STRONG_PARAPHRASE_PROMPT base?
    // User requested: "Use this instead: const STRONG_PARAPHRASE_PROMPT ..."
    // Let's use STRONG_PARAPHRASE_PROMPT as the base if tone is standard/default BUT we want a 'strong' rewrite.
    // Or we can just append the instructions.
    // The user's request seemed to imply REPLACING the prompt with STRONG_PARAPHRASE_PROMPT.
    // Let's use STRONG_PARAPHRASE_PROMPT if strength is 'strong' and tone is 'standard'.

    if (tone === "standard" && strength === "strong") {
        systemPrompt = STRONG_PARAPHRASE_PROMPT;
    }

    // Append Strength Instruction
    systemPrompt += getStrengthInstruction(strength);

    try {
        const response = await deepseek.post("/chat/completions", {
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: temperature,
            max_tokens: 4000 // Increased to prevent truncation for long inputs
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("DeepSeek API Error:", error.response ? error.response.data : error.message);
        throw new Error("AI Service Unavailable");
    }
}
