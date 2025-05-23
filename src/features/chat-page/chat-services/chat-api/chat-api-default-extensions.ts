"use server";
import "server-only";

import { ServerActionResponse } from "@/features/common/server-action-response";
import { OpenAIDALLEInstance } from "@/features/common/services/openai";
import { uniqueId } from "@/features/common/util";
import { GetImageUrl, UploadImageToStore } from "../chat-image-service";
import { ChatThreadModel } from "../models";
import { Ppt } from "../ppt-api";

export const GetDefaultExtensions = async (props: {
  chatThread: ChatThreadModel;
  userMessage: string;
  signal: AbortSignal;
}): Promise<ServerActionResponse<Array<any>>> => {
  const defaultExtensions: Array<any> = [];

  // Add image creation Extension
  defaultExtensions.push({
    type: "function",
    function: {
      function: async (args: any) =>
        await executeCreateImage(
          args,
          props.chatThread.id,
          props.userMessage,
          props.signal
        ),
      parse: (input: string) => JSON.parse(input),
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string" },
        },
      },
      description:
        "You must ONLY use the function create_img if and only if the user asks you to create an image with the sentence 'crée une image' or 'create an image'. Don't use this function without this instruction.You only use the create_img function if you explicitly include the phrase 'creates an image'.Do not use this function for diagrams, graphs, charts",
      name: "create_img",
    },
  });

  // Add any other default Extension here

  return {
    status: "OK",
    response: defaultExtensions,
  };
};

export const GetExportPPTExtensions = async (props: {
  chatThread: ChatThreadModel;
  userMessage: string;
  signal: AbortSignal;
}): Promise<ServerActionResponse<Array<any>>> => {
  const defaultExtensions: Array<any> = [];

  // Add PPT creation Extension
  defaultExtensions.push({
    type: "function",
    function: {
      function: async (args: any) =>
        await executeCreatePPT(
          args,
          props.chatThread.id,
          props.userMessage,
          props.signal
        ),
      parse: (input: string) => JSON.parse(input),
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string"},
        },
      },
      description:
        `You must use this to only export a ppt. You must ask after writing a presentation if the user wants to export it before using this function.
         The output passing by prompt parameter must be a valid json respecting the following rules. This json is used to export ppt with the pptgenjs library.
          Choose the slide that seems most relevant to you. And use the most interesting options to create impactful slides (list, bold text, chart).
          Type of slide possible in pageContents :  textOn1ColumnSlide | textWithChartSlide | dividerSlide.
          Type of chart possible in textWithChartSlide : "area" | "bar"| "bar3d"| "bubble"| "doughnut"| "line"| "pie"| "radar"| "scatter".
          Complete Rules used for formatted your json response : export interface SlideTitle{
  title: string;
  subtitle: string;
}

export interface BulletPoint{
  value: string,
  indentLevel: number
}

export interface SlideText{
  text: string;
  bullet: boolean;
  indentlevel: number;
  bold: boolean;

}

export type SlideType = "texton1column" | "textwithChart";
export type ChartType = "area" | "bar"| "bar3d"| "bubble"| "doughnut"| "line"| "pie"| "radar"| "scatter";

export interface Chart{
  chartType: ChartType;
  name: string;
  labels: Array<string>;
  values: Array<number>;
}

export interface BaseSlideContent {
  title: string;
  subtitle?: string;
}

export interface BaseSlideContentText extends BaseSlideContent {
    text_body: SlideText[];
}

// Slide de type "texton1column"
export interface TextOn1ColumnSlide extends BaseSlideContentText {
  type: "texton1column";
  subtitle?: string;
  little_title_section: string;
  text_body: SlideText[];
}

// Slide de type "textwithChart"
export interface TextWithChartSlide extends BaseSlideContentText {
  type: "textwithChart";
  chart: Chart;
  text_body: SlideText[];
}

export interface DividerSlide extends BaseSlideContent {
  type: "dividerSlide";
  numberSection: string
}

export type SlideContent = TextOn1ColumnSlide | TextWithChartSlide | DividerSlide;

export interface SlideSummary{
  sectionTitle: string;
  sectionSubtitle: string;
}

export interface Slides{
  pageTitle: SlideTitle;
  pageSummary: SlideSummary[];
  pageContents: SlideContent[];
}
          Output strictly as valid JSON following this schema
        {"pageTitle":{"title":"Présentation Exemple pour Test de Génération de PPT","subtitle":"Développement et Test"},
  "pageSummary":[{"sectionTitle": "Titre court", "sectionSubtitle": "Sous titre"},{"sectionTitle": "Titre court", "sectionSubtitle": "Sous titre"}],
  "pageContents":[{"type":"dividerSlide", "numberSection": "01", "title": "Un loong titre Introduction", "subtitle": "Sous titre"},{"title":"Introduction","type":"texton1column","little_title_section":"Contexte",
  "text_body":[{"text":"Cette présentation est un exemple pour tester la génération de PPT.","bullet":false,"indentlevel":0,"bold":true},
  {"text":"Elle inclut différents types de contenu et de graphiques.","bullet":true,"indentlevel":1,"bold":false}]},
  {"title":"Détails du Projet","type":"texton1column","little_title_section":"Description","text_body":
  [{"text":"Le projet vise à développer une solution de génération de présentations automatisées.","bullet":false,"indentlevel":0,"bold":false}]},
  {"title":"Points Clés","type":"texton1column","little_title_section":"Liste des Éléments",
  "text_body":[{"text":"Voici les points clés à considérer :","bullet":false,"indentlevel":0,"bold":true},
  {"text":"1. Objectifs du projet","bullet":true,"indentlevel":1,"bold":false},
  {"text":" a. Automatisation des présentations","bullet":true,"indentlevel":2,"bold":false},
  {"text":" b. Amélioration de l'efficacité","bullet":true,"indentlevel":3,"bold":false},
  {"text":"2. Technologies utilisées","bullet":true,"indentlevel":1,"bold":false},
  {"text":" a. API de génération de PPT","bullet":true,"indentlevel":2,"bold":false},
  {"text":" b. Outils de visualisation de données","bullet":true,"indentlevel":2,"bold":false}]},
  {"title":"Graphique des Ventes","type":"textwithChart","subtitle":"Analyse des Ventes",
  "little_title_section":"Données de Ventes",
  "text_body":[{"text":"Le graphique ci-dessous montre l'évolution des ventes sur 4 trimestres.","bullet":false,"indentlevel":0,"bold":false},
  {"text":"Les données sont présentées sous forme de graphique en barres.","bullet":true,"indentlevel":1,"bold":false}],
  "chart":{"chartType":"bar","name":"Ventes Trimestrielles","labels":["T1","T2","T3","T4"],"values":[15000,20000,18000,22000]}},
  {"title":"Répartition des Coûts","type":"textwithChart","subtitle":"Analyse des Coûts","little_title_section":"Données de Coûts",
  "text_body":[{"text":"Le graphique ci-dessous montre la répartition des coûts par catégorie.","bullet":false,"indentlevel":0,"bold":false},
  {"text":"Les données sont présentées sous forme de graphique circulaire.","bullet":true,"indentlevel":1,"bold":false}],
  "chart":{"chartType":"pie","name":"Répartition des Coûts","labels":["Marketing","Développement","Opérations","Autres"],
  "values":[30000,50000,20000,10000]}},{"title":"Tendances du Marché","type":"textwithChart","subtitle":"Analyse des Tendances",
  "little_title_section":"Données de Marché","text_body":[{"text":"Le graphique ci-dessous montre les tendances du marché sur 5 ans.",
  "bullet":false,"indentlevel":0,"bold":false},{"text":"Les données sont présentées sous forme de graphique linéaire.","bullet":true,"indentlevel":1,"bold":false}],
  "chart":{"chartType":"line","name":"Tendances du Marché","labels":["2019","2020","2021","2022","2023"],"values":[100000,120000,150000,170000,200000]}}]}
        `,
      name: "export_ppt",
    },
  });

  return {
    status: "OK",
    response: defaultExtensions,
  };
};

// Extension for image creation using DALL-E
async function executeCreateImage(
  args: { prompt: string },
  threadId: string,
  userMessage: string,
  signal: AbortSignal
) {
  console.log("createImage called with prompt:", args.prompt);

  if (!args.prompt) {
    return "No prompt provided";
  }

  // Check the prompt is < 4000 characters (DALL-E 3)
  if (args.prompt.length >= 4000) {
    return "Prompt is too long, it must be less than 4000 characters";
  }

  const openAI = OpenAIDALLEInstance();

  let response;

  try {
    response = await openAI.images.generate(
      {
        model: "dall-e-3",
        prompt: userMessage,
        response_format: "b64_json",
      },
      {
        signal,
      }
    );
  } catch (error) {
    console.error("🔴 error:\n", error);
    return {
      error:
        "There was an error creating the image: " +
        error +
        "Return this message to the user and halt execution.",
    };
  }

  // Check the response is valid
  if (response.data === undefined || (response.data && response.data.length > 0 && response.data[0].b64_json === undefined)) {
    return {
      error:
        "There was an error creating the image: Invalid API response received. Return this message to the user and halt execution.",
    };
  }

  // upload image to blob storage
  const imageName = `${uniqueId()}.png`;

  try {
    await UploadImageToStore(
      threadId,
      imageName,
      Buffer.from(response.data[0].b64_json, "base64")
    );

    const imageUrl = await GetImageUrl(threadId, imageName) as string;

    const updated_response = {
      revised_prompt: response.data[0].revised_prompt,
      url: imageUrl,
    };

    return updated_response;
  } catch (error) {
    console.error("🔴 error:\n", error);
    return {
      error:
        "There was an error storing the image: " +
        error +
        "Return this message to the user and halt execution.",
    };
  }
}
async function executeCreatePPT(
  args: { prompt: string },
  threadId: string,
  userMessage: string,
  signal: AbortSignal
) {
  const b64Result = await Ppt(args.prompt);
  // upload image to blob storage
  const pptName = `${uniqueId()}.pptx`;

  try {
    await UploadImageToStore(
      threadId,
      pptName,
      Buffer.from(b64Result)
    );

    const imageUrl = await GetImageUrl(threadId, pptName) as string;

    const updated_response = {
      url_to_download: imageUrl,
    };

    return updated_response;
  } catch (error) {
    console.error("🔴 error:\n", error);
    return {
      error:
        "There was an error storing the ppt: " +
        error +
        "Return this message to the user and halt execution.",
    };
  }
}

