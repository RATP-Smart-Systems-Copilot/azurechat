"use server";
import "server-only";

import { getCurrentUser, userHashedId } from "@/features/auth-page/helpers";
import { UpsertChatThread } from "@/features/chat-page/chat-services/chat-thread-service";
import {
  CHAT_THREAD_ATTRIBUTE,
  ChatThreadModel,
} from "@/features/chat-page/chat-services/models";
import {
  ServerActionResponse,
  zodErrorsToServerActionErrors,
} from "@/features/common/server-action-response";
import { HistoryContainer } from "@/features/common/services/cosmos";
import { uniqueId } from "@/features/common/util";
import { SqlQuerySpec } from "@azure/cosmos";
import { DocumentMetadata, PERSONA_ATTRIBUTE, PersonaModel, PersonaModelSchema } from "./models";
import { defaultGPTModel } from "@/features/common/services/openai";
import { FindAllChatDocumentsByPersona } from "@/features/chat-page/chat-services/chat-document-service";
import { DeleteDocumentsForPersona } from "@/features/chat-page/chat-services/azure-ai-search/azure-ai-search";
import { DeletePersonaDocumentsByPersonaId, UpdateOrAddPersonaDocuments  as AddOrUpdatePersonaDocuments } from "./persona-documents-service";
import { RevalidateCache } from "@/features/common/navigation-helpers";

interface PersonaInput {
  name: string;
  gptModel: string;
  description: string;
  personaMessage: string;
  temperature: number;
  isPublished: boolean;
}

export const FindPersonaByID = async (
  id: string
): Promise<ServerActionResponse<PersonaModel>> => {
  try {
    const querySpec: SqlQuerySpec = {
      query: "SELECT * FROM root r WHERE r.type=@type AND r.id=@id",
      parameters: [
        {
          name: "@type",
          value: PERSONA_ATTRIBUTE,
        },
        {
          name: "@id",
          value: id,
        },
      ],
    };

    const { resources } = await HistoryContainer()
      .items.query<PersonaModel>(querySpec)
      .fetchAll();

    if (resources.length === 0) {
      return {
        status: "NOT_FOUND",
        errors: [
          {
            message: "Persona not found",
          },
        ],
      };
    }

    return {
      status: "OK",
      response: resources[0],
    };
  } catch (error) {
    return {
      status: "ERROR",
      errors: [
        {
          message: `Error creating persona: ${error}`,
        },
      ],
    };
  }
};

export const CreatePersona = async (
  props: PersonaInput,
  sharePointFiles: DocumentMetadata[]
): Promise<ServerActionResponse<PersonaModel>> => {
  try {
    const user = await getCurrentUser();

    const personaDocumentIds = await AddOrUpdatePersonaDocuments(
      sharePointFiles,
      []
    );
    if (personaDocumentIds.status !== "OK") {
      return {
        status: "ERROR",
        errors: personaDocumentIds.errors,
      };
    }

    const modelToSave: PersonaModel = {
      id: uniqueId(),
      name: props.name,
      gptModel: props.gptModel,
      description: props.description,
      personaMessage: props.personaMessage,
      temperature: props.temperature,
      isPublished: user.isAdmin ? props.isPublished : false,
      userId: await userHashedId(),
      createdAt: new Date(),
      type: "PERSONA",
      sharedWith: [],
      personaDocumentIds: personaDocumentIds.response,
    };

    const valid = ValidateSchema(modelToSave);

    if (valid.status !== "OK") {
      return valid;
    }

    const { resource } = await HistoryContainer().items.create<PersonaModel>(
      modelToSave
    );

    if (resource) {
      return {
        status: "OK",
        response: resource,
      };
    } else {
      return {
        status: "ERROR",
        errors: [
          {
            message: "Error creating persona",
          },
        ],
      };
    }
  } catch (error) {
    return {
      status: "ERROR",
      errors: [
        {
          message: `Error creating persona: ${error}`,
        },
      ],
    };
  }
};

export const EnsurePersonaOperation = async (
  personaId: string
): Promise<ServerActionResponse<PersonaModel>> => {
  const personaResponse = await FindPersonaByID(personaId);
  const currentUser = await getCurrentUser();
  const hashedId = await userHashedId();

  if (personaResponse.status === "OK") {
    if (currentUser.isAdmin || personaResponse.response.userId === hashedId) {
      return personaResponse;
    }
  }

  return {
    status: "UNAUTHORIZED",
    errors: [
      {
        message: `Persona not found with id: ${personaId}`,
      },
    ],
  };
};

export const DeletePersona = async (
  personaId: string
): Promise<ServerActionResponse<PersonaModel>> => {
  try {
    const personaResponse = await EnsurePersonaOperation(personaId);

    if (personaResponse.status === "OK") {
      await DeletePersonaDocumentsByPersonaId(personaId);
      const chatDocumentsResponse = await FindAllChatDocumentsByPersona(personaId);

      if (chatDocumentsResponse.status !== "OK") {
        return chatDocumentsResponse;
      }

      const chatDocuments = chatDocumentsResponse.response;

      if (chatDocuments.length !== 0) {
        await DeleteDocumentsForPersona(personaId);
      }
      const { resource: deletedPersona } = await HistoryContainer()
        .item(personaId, personaResponse.response.userId)
        .delete();

      return {
        status: "OK",
        response: deletedPersona,
      };
    }

    return personaResponse;
  } catch (error) {
    return {
      status: "ERROR",
      errors: [
        {
          message: `Error deleting persona: ${error}`,
        },
      ],
    };
  }
};

export const UpsertPersona = async (
  personaInput: PersonaModel,
  sharePointFiles?: DocumentMetadata[]
): Promise<ServerActionResponse<PersonaModel>> => {
  try {
    const personaResponse = await EnsurePersonaOperation(personaInput.id);

    if (personaResponse.status === "OK") {
      const { response: persona } = personaResponse;
      const user = await getCurrentUser();
      let personaDocumentIds: string[] = (personaInput.personaDocumentIds || []);
      let personaDocumentIdsResponse = null;

      if(sharePointFiles !== undefined){
        personaDocumentIdsResponse  = await AddOrUpdatePersonaDocuments(
          sharePointFiles,
          personaInput.personaDocumentIds || []
        );

        if (personaDocumentIdsResponse.status === "OK") {
          personaDocumentIds = personaDocumentIdsResponse.response;
        }
      }

      const modelToUpdate: PersonaModel = {
        ...persona,
        name: personaInput.name,
        gptModel: personaInput.gptModel,
        description: personaInput.description,
        personaMessage: personaInput.personaMessage,
        temperature: personaInput.temperature,
       // isPublished: user.isAdmin ? personaInput.isPublished : persona.isPublished,
        isPublished: personaInput.isPublished,
        createdAt: new Date(),
        sharedWith: personaInput.sharedWith || [],
        personaDocumentIds: personaDocumentIds,
      };

      const validationResponse = ValidateSchema(modelToUpdate);
      if (validationResponse.status !== "OK") {
        return validationResponse;
      }

      const { resource } = await HistoryContainer().items.upsert<PersonaModel>(
        modelToUpdate
      );

      if (personaDocumentIdsResponse && personaDocumentIdsResponse.status !== "OK") {
        RevalidateCache({
          page: "persona",
        });

        return {
          status: "ERROR",
          errors: personaDocumentIdsResponse.errors,
        };
      }

      if (resource) {
        return {
          status: "OK",
          response: resource,
        };
      }

      return {
        status: "ERROR",
        errors: [
          {
            message: "Error updating persona",
          },
        ],
      };
    }

    return personaResponse;
  } catch (error) {
    return {
      status: "ERROR",
      errors: [
        {
          message: `Error updating persona: ${error}`,
        },
      ],
    };
  }
};

export const FindAllPersonaForCurrentUser = async (): Promise<
  ServerActionResponse<Array<PersonaModel>>
> => {
  try {
    const querySpec: SqlQuerySpec = {
      query:
        "SELECT * FROM root r WHERE r.type=@type AND (r.isPublished=@isPublished OR r.userId=@userId OR ARRAY_CONTAINS(r.sharedWith, @userId)) ORDER BY r.createdAt DESC",
      parameters: [
        {
          name: "@type",
          value: PERSONA_ATTRIBUTE,
        },
        {
          name: "@isPublished",
          value: true,
        },
        {
          name: "@userId",
          value: await userHashedId(),
        },
      ],
    };

    const { resources } = await HistoryContainer()
      .items.query<PersonaModel>(querySpec)
      .fetchAll();

    return {
      status: "OK",
      response: resources,
    };
  } catch (error) {
    return {
      status: "ERROR",
      errors: [
        {
          message: `Error finding persona: ${error}`,
        },
      ],
    };
  }
};

export const CreatePersonaChat = async (
  personaId: string
): Promise<ServerActionResponse<ChatThreadModel>> => {
  const personaResponse = await FindPersonaByID(personaId);
  const user = await getCurrentUser();

  if (personaResponse.status === "OK") {
    const persona = personaResponse.response;
    const personaGptModel = personaResponse.response.gptModel;
    const gptModel = personaGptModel ? personaGptModel : defaultGPTModel;

    const response = await UpsertChatThread({
      name: persona.name,
      useName: user.name,
      userId: await userHashedId(),
      id: "",
      createdAt: new Date(),
      lastMessageAt: new Date(),
      bookmarked: false,
      isDeleted: false,
      type: CHAT_THREAD_ATTRIBUTE,
      personaMessage: persona.personaMessage,
      personaMessageTitle: persona.name,
      personaTemperature: persona.temperature,
      extension: [],
      gptModel: gptModel,
      personaId: personaId,
      documentIds: persona.personaDocumentIds || [],
    });

    return response;
  }
  return personaResponse;
};

const ValidateSchema = (model: PersonaModel): ServerActionResponse => {
  const validatedFields = PersonaModelSchema.safeParse(model);

  if (!validatedFields.success) {
    return {
      status: "ERROR",
      errors: zodErrorsToServerActionErrors(validatedFields.error.errors),
    };
  }

  return {
    status: "OK",
    response: model,
  };
};
