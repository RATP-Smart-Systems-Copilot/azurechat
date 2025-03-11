export const AI_NAME = "RATP Smart Systems";
export const AI_DESCRIPTION = `Bienvenue sur l'interface ChatGPT, le foyer de vos assistants virtuels. \nProfitez de la puissance de l'IA pour répondre à vos questions, comprendre des images ou des documents, stocker vos prompts favoris, le tout en un seul endroit facile d'accès. ChatGPT est là pour vous aider à gagner du temps, améliorer votre productivité et vous permettre de vous concentrer sur des tâches plus importantes !`;
export const CHAT_DEFAULT_PERSONA = AI_NAME + " default";

export const CHAT_DEFAULT_SYSTEM_PROMPT = `You are ChatGPT, the conversational assistant dedicated to the internal interface of RATP Smart Systems, used by company employees. Your mission is to provide precise, contextualized, and relevant answers to inquiries related to operations, mobility, technological innovation, and internal processes at RATP Smart Systems.

Guidelines for Your Interactions:

Expertise & Context Awareness:

Understand and integrate the missions, values, and specificities of RATP Smart Systems.
Consider internal processes, tools used, and the company's strategic challenges in your responses.
Tone & Style:

Maintain a professional, clear, concise, and solution-oriented tone.
Be empathetic and pedagogical while remaining factual and rigorous in your answers.
Confidentiality & Security:

Never disclose sensitive or confidential information.
Strictly adhere to internal security policies and company data confidentiality.
Adaptability & Responsiveness:

Analyze the context and tailor your responses to the specific needs of employees.
If certain information is unavailable or requires verification, inform the user and direct them to appropriate internal resources.
Operational Assistance:

Provide detailed instructions for using internal tools, navigating information systems, and executing operational procedures.
Simplify technical complexity to make information accessible to all employees, regardless of their level of expertise.
Updates & References:

Specify when the information provided may evolve and recommend consulting official channels for the latest updates.
Objective:
Your goal is to enhance operational efficiency and provide high-quality support to RATP Smart Systems employees by delivering precise, reliable, and secure responses to their inquiries.
You must always return in markdown format (not latex) with the best format: table, list, paragraph... For math expression DON'T USE LateX, keep markdown`;

export const NEW_CHAT_NAME = "New chat";

export interface PromptPricing{
  price: number;
  unit: number;
}

export interface GPT{
  model: string;
  name: string;
  description: string;
  prompt: PromptPricing;
  completion: PromptPricing;
  provider: 'OpenAI'|'MistralAI'
}

export interface GPTS {
  [key: string]: GPT;
}

export const getModelOptions = () : GPTS => {
  return {
    'gpt-4o-mini': {
      'model': process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
      'name': 'GPT 4o mini',
      'description': 'GPT 4o mini pour vos tâches courantes : contexte entré 128k tokens maximal, 16 384 tokens maximal par réponse et un seuil de connaissance à octobre 2023',
      'prompt': { 'price': 0.00015280, 'unit': 1000 },
      'completion': { 'price': 0.0006112, 'unit': 1000 },
      'provider': 'OpenAI',
    },
    'gpt4o': {
      'model': process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME_4o,
      'name': 'GPT 4o',
      'description': 'GPT 4o pour les tâches complexes : contexte 128k tokens maximal en entrée, 16 384 tokens maximal par réponse et un seuil de connaissance à octobre 2023',
      'prompt': { 'price': 0.00254665, 'unit': 1000 },
      'completion': { 'price': 0.0101866, 'unit': 1000 },
      'provider': 'OpenAI',
    },
    'o1-mini': {
      'model': process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME_o1mini,
      'name': 'o1 mini',
      'description': 'GPT o1 mini pour les raisonnements complexes : contexte 128k tokens maximal en entrée, 65 536 tokens maximal par réponse et un seuil de connaissance à octobre 2023',
      'prompt': { 'price': 0.0031663, 'unit': 1000 },
      'completion': { 'price': 0.012664908, 'unit': 1000 },
      'provider': 'OpenAI',
    },
    'o3-mini': {
      'model': process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME_o3mini,
      'name': 'o3 mini',
      'description': 'o3 mini pour les raisonnements complexes, calculs mathématiques, et le codage : contexte 200k tokens maximal en entrée, 100k tokens maximal par réponse et un seuil de connaissance à octobre 2023',
      'prompt': { 'price': 0.0031663, 'unit': 1000 },
      'completion': { 'price': 0.012664908, 'unit': 1000 },
      'provider': 'OpenAI',
    },
    'Codestral-2501': {
      'model': process.env.AZURE_AI_API_DEPLOYMENT_NAME_Codestral,
      'name': 'Codestral',
      'description': 'Codestral formé spécifiquement pour les tâches de code: contexte 256k tokens maximal en entrée, seuil de connaissance à août 2023.',
      'prompt': { 'price': 0.0003, 'unit': 1000 },
      'completion': { 'price': 0.0009, 'unit': 1000 },
      'provider': 'MistralAI',
    },
    'Mistral-Nemo': {
      'model': process.env.AZURE_AI_API_DEPLOYMENT_NAME_MistralNemo,
      'name': 'Mistral Nemo',
      'description': ' Mistral Nemo pour vos tâches courantes : contexte entré 128k tokens maximal, seuil de connaissance à août 2023.',
      'prompt': { 'price': 0.0003, 'unit': 1000 },
      'completion': { 'price': 0.0009, 'unit': 1000 },
      'provider': 'MistralAI',
    },
  };

};

export const modelOptions = getModelOptions();
