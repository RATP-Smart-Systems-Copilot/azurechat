import { proxy, useSnapshot } from "valtio";
import { RevalidateCache } from "../common/navigation-helpers";
import { DocumentMetadata, PERSONA_ATTRIBUTE, PERSONA_TEMPERATURE, PersonaModel } from "./persona-services/models";
import {
  CreatePersona,
  UpsertPersona,
} from "./persona-services/persona-service";
import { defaultGPTModel } from "../common/services/openai";
import { idea } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { FindAllChatDocumentsByPersona } from "../chat-page/chat-services/chat-document-service";
import { ChatDocumentModel } from "../chat-page/chat-services/models";

class PersonaState {
  private defaultModel: PersonaModel = {
    id: "",
    name: "",
    description: "",
    personaMessage: "",
    temperature: PERSONA_TEMPERATURE,
    createdAt: new Date(),
    isPublished: false,
    type: "PERSONA",
    userId: "",
    gptModel: defaultGPTModel,
  };

  public isOpened: boolean = false;
  public errors: string[] = [];
  public persona: PersonaModel = { ...this.defaultModel };

  public updateOpened(value: boolean) {
    this.isOpened = value;
  }

  public updatePersona(persona: PersonaModel) {
    this.persona = {
      ...persona,
    };
    this.isOpened = true;
  }

  public newPersona() {
    this.persona = {
      ...this.defaultModel,
    };
    this.isOpened = true;
  }

  public newPersonaAndOpen(persona: {
    name: string;
    description: string;
    personaMessage: string;
    temperature: number;
  }) {
    this.persona = {
      ...this.defaultModel,
      name: persona.name,
      description: persona.description,
      personaMessage: persona.personaMessage,
      temperature: persona.temperature,
    };
    this.isOpened = true;
  }

  public updateErrors(errors: string[]) {
    this.errors = errors;
  }

}

export const personaStore = proxy(new PersonaState());

export const usePersonaState = () => {
  return useSnapshot(personaStore);
};

export const getDocumentsPersona = async (personaId : string):  Promise<Array<ChatDocumentModel>>  => {
  const chatDocumentsResponse = await FindAllChatDocumentsByPersona(personaId);

  if (chatDocumentsResponse.status !== "OK") {
    return [];
  }

  return chatDocumentsResponse.response;
}

export const addOrUpdatePersona = async (previous: any, formData: FormData)=> {
  const sharePointFiles = HandleSharePointFiles(formData);
  personaStore.updateErrors([]);

  const model = FormDataToPersonaModel(formData);
  const response =
    model.id && model.id !== ""
      ? await UpsertPersona(model, sharePointFiles)
      : await CreatePersona(model, sharePointFiles);

  if (response.status === "OK") {
    personaStore.updateOpened(false);
    RevalidateCache({
      page: "persona",
    });
  } else {
    personaStore.updateErrors(response.errors.map((e) => e.message));
  }
  return response;
};

const HandleSharePointFiles = (formData: FormData): DocumentMetadata[] => {
  const filesObjStrings = formData.getAll(
    "selectedSharePointDocumentIds"
  ) as string[];

  if (!filesObjStrings || filesObjStrings[0].length === 0) return [];

  const fileObj = JSON.parse(filesObjStrings[0]) as DocumentMetadata[];
  return Array.isArray(fileObj) ? fileObj : [];
};

export const FormDataToPersonaModel = (formData: FormData): PersonaModel => {
  const sharedWith = formData.get("sharedWith") as string;
  const sharedWithArray = sharedWith ? sharedWith.split(",") : [];
  const ids = formData.getAll("personaDocumentIds") as string[];
  const fileObj = JSON.parse(ids[0]) as string[];
  const personaDocumentIds =  Array.isArray(fileObj) ? fileObj : [];

  return {
    id: formData.get("id") as string,
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    personaMessage: formData.get("personaMessage") as string,
    temperature: parseFloat(formData.get("temperature") as string),
    isPublished: formData.get("isPublished") === "on" ? true : false,
    userId: "", // the user id is set on the server once the user is authenticated
    createdAt: new Date(),
    type: PERSONA_ATTRIBUTE,
    gptModel: formData.get("gptModel") as string,
    sharedWith: sharedWithArray, // Ajout du champ shareWith
    personaDocumentIds: personaDocumentIds,
  };
};
