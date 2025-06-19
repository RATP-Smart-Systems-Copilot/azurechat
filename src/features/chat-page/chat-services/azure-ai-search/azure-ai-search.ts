"use server";
import "server-only";

import { userHashedId } from "@/features/auth-page/helpers";
import { ServerActionResponse } from "@/features/common/server-action-response";
import {
  AzureAISearchIndexClientInstance,
  AzureAISearchInstance,
} from "@/features/common/services/ai-search";
import { OpenAIEmbeddingInstance } from "@/features/common/services/openai";
import { uniqueId } from "@/features/common/util";
import {
  AzureKeyCredential,
  SearchClient,
  SearchIndex,
} from "@azure/search-documents";

const debug = process.env.DEBUG === "true";

export interface AzureSearchDocumentIndex {
  id: string;
  pageContent: string;
  embedding?: number[];
  user: string;
  chatThreadId?: string | null;
  metadata: string | null;
  personaId?: string | null;
  documentId?: string | null;
}

export type DocumentSearchResponse = {
  score: number;
  document: AzureSearchDocumentIndex;
};

export const SimpleSearch = async (
  searchText?: string,
  filter?: string,
  fileName?: string
): Promise<ServerActionResponse<Array<DocumentSearchResponse>>> => {
  try {
    if (debug) console.log("Executing SimpleSearch with searchText:", searchText, "filter:", filter);
    const instance = AzureAISearchInstance<AzureSearchDocumentIndex>();
    const searchResults = await instance.search(searchText, { filter: filter });
    const results: Array<DocumentSearchResponse> = [];
    for await (const result of searchResults.results) {
      if(fileName && result.document.metadata !== fileName)
        continue;
      results.push({
        score: result.score,
        document: result.document,
      });
    }

    if (debug) console.log("SimpleSearch results:", results);
    return {
      status: "OK",
      response: results,
    };
  } catch (e) {
    console.error("SimpleSearch error:", e);
    return {
      status: "ERROR",
      errors: [
        {
          message: `${e}`,
        },
      ],
    };
  }
};

export const SimilaritySearch = async (
  searchText: string,
  k: number,
  filter?: string
): Promise<ServerActionResponse<Array<DocumentSearchResponse>>> => {
  try {
    if (debug) console.log("Executing SimilaritySearch with searchText:", searchText, "k:", k, "filter:", filter);
    const openai = OpenAIEmbeddingInstance();
    const embeddings = await openai.embeddings.create({
      input: searchText,
      model: "",
    });

    if (debug) console.log("Embeddings obtained:", embeddings);

    const searchClient = AzureAISearchInstance<AzureSearchDocumentIndex>();
    const searchResults = await searchClient.search(searchText, {
      top: k,
      filter: filter,
      vectorSearchOptions: {
        queries: [
          {
            vector: embeddings.data[0].embedding,
            fields: ["embedding"],
            kind: "vector",
            kNearestNeighborsCount: 10,
          },
        ],
      },
    });

    const results: Array<DocumentSearchResponse> = [];
    for await (const result of searchResults.results) {
      results.push({
        score: result.score,
        document: result.document,
      });
    }

    if (debug) console.log("SimilaritySearch results:", results);
    return {
      status: "OK",
      response: results,
    };
  } catch (e) {
    console.error("SimilaritySearch error:", e);
    return {
      status: "ERROR",
      errors: [
        {
          message: `${e}`,
        },
      ],
    };
  }
};

export const ExtensionSimilaritySearch = async (props: {
  searchText: string;
  vectors: string[];
  apiKey: string;
  searchName: string;
  indexName: string;
}): Promise<ServerActionResponse<Array<DocumentSearchResponse>>> => {
  try {
    if (debug) console.log("Executing ExtensionSimilaritySearch with props:", props);
    const openai = OpenAIEmbeddingInstance();
    const { searchText, vectors, apiKey, searchName, indexName } = props;

    const embeddings = await openai.embeddings.create({
      input: searchText,
      model: "",
    });

    if (debug) console.log("Embeddings obtained:", embeddings);

    const endpointSuffix = process.env.AZURE_SEARCH_ENDPOINT_SUFFIX || "search.windows.net";
    const endpoint = `https://${searchName}.${endpointSuffix}`;
    const searchClient = new SearchClient(
      endpoint,
      indexName,
      new AzureKeyCredential(apiKey)
    );

    const searchResults = await searchClient.search(searchText, {
      top: 3,
      vectorSearchOptions: {
        queries: [
          {
            vector: embeddings.data[0].embedding,
            fields: vectors,
            kind: "vector",
            kNearestNeighborsCount: 10,
          },
        ],
      },
    });

    const results: Array<any> = [];
    for await (const result of searchResults.results) {
      const item = {
        score: result.score,
        document: result.document,
      };

      const document = item.document as any;
      const newDocument: any = {};

      for (const key in document) {
        const hasKey = vectors.includes(key);
        if (!hasKey) {
          newDocument[key] = document[key];
        }
      }

      results.push({
        score: result.score,
        document: newDocument,
      });
    }

    if (debug) console.log("ExtensionSimilaritySearch results:", results);
    return {
      status: "OK",
      response: results,
    };
  } catch (e) {
    console.error("ExtensionSimilaritySearch error:", e);
    return {
      status: "ERROR",
      errors: [
        {
          message: `${e}`,
        },
      ],
    };
  }
};

export const IndexDocuments = async (
  fileName: string,
  docs: string[],
  chatThreadId?: string,
  personaId?: string,
  documentId?: string,
): Promise<Array<ServerActionResponse<boolean>>> => {
  try {
    if (debug) console.log("Indexing documents with fileName:", fileName, "chatThreadId:", chatThreadId);
    const documentsToIndex: AzureSearchDocumentIndex[] = [];

    for (const doc of docs) {
      const docToAdd: AzureSearchDocumentIndex = {
        id: uniqueId(),
        chatThreadId: chatThreadId || null,
        user: await userHashedId(),
        pageContent: doc,
        metadata: fileName || null,
        embedding: [],
        personaId: personaId,
        documentId: documentId || null,
      };

      documentsToIndex.push(docToAdd);
    }

    if (debug) console.log("Documents to index:", documentsToIndex);

    const instance = AzureAISearchInstance();
    const embeddingsResponse = await EmbedDocuments(documentsToIndex);

    if (embeddingsResponse.status === "OK") {
      const uploadResponse = await instance.uploadDocuments(
        embeddingsResponse.response
      );

      const response: Array<ServerActionResponse<boolean>> = [];
      uploadResponse.results.forEach((r) => {
        if (r.succeeded) {
          response.push({
            status: "OK",
            response: r.succeeded,
          });
        } else {
          response.push({
            status: "ERROR",
            errors: [
              {
                message: `${r.errorMessage}`,
              },
            ],
          });
        }
      });

      if (debug) console.log("IndexDocuments response:", response);
      return response;
    }

    return [embeddingsResponse];
  } catch (e) {
    console.error("IndexDocuments error:", e);
    return [
      {
        status: "ERROR",
        errors: [
          {
            message: `${e}`,
          },
        ],
      },
    ];
  }
};

export const DeleteDocumentsForChatThreadId = async (
  chatThreadId: string
): Promise<Array<ServerActionResponse<boolean>>> => {
  if (debug)
    console.log("Deleting documents for chatThreadId:", chatThreadId);
  return DeleteDocuments(`chatThreadId eq '${chatThreadId}'`);
};

export const DeleteDocumentsForPersona = async (
  personaId: string
): Promise<Array<ServerActionResponse<boolean>>> => {
  if (debug)
    console.log("Deleting documents for personaId:", personaId);
  return DeleteDocuments(`personaId eq '${personaId}'`);
};

export const DeleteDocumentPersonaByID = async (
  fileName: string, 
  personaId: string,
): Promise<Array<ServerActionResponse<boolean>>> => {
  if (debug)
    console.log("Deleting document for id:", fileName);
  return DeleteDocuments(`personaId eq '${personaId}'`, fileName);
};


export const DeleteDocuments = async (
  filter: string,
  fileName?: string,
): Promise<Array<ServerActionResponse<boolean>>> => {
  try {
    const documentsInChatResponse = await SimpleSearch(
      undefined,
      filter, 
      fileName,
    );

    if (documentsInChatResponse.status === "OK") {
      const instance = AzureAISearchInstance();
      const deletedResponse = await instance.deleteDocuments(
        documentsInChatResponse.response.map((r) => r.document)
      );

      const response: Array<ServerActionResponse<boolean>> = [];
      deletedResponse.results.forEach((r) => {
        if (r.succeeded) {
          response.push({
            status: "OK",
            response: r.succeeded,
          });
        } else {
          response.push({
            status: "ERROR",
            errors: [
              {
                message: `${r.errorMessage}`,
              },
            ],
          });
        }
      });

      if (debug) console.log("DeleteDocuments response:", response);
      return response;
    }

    return [documentsInChatResponse];
  } catch (e) {
    console.error("DeleteDocuments error:", e);
    return [
      {
        status: "ERROR",
        errors: [
          {
            message: `${e}`,
          },
        ],
      },
    ];
  }
};

export const EmbedDocuments = async (
  documents: Array<AzureSearchDocumentIndex>
): Promise<ServerActionResponse<Array<AzureSearchDocumentIndex>>> => {
  try {
    if (debug) console.log("Embedding documents:", documents.map((d) => d.id));
    const openai = OpenAIEmbeddingInstance();
    const contentsToEmbed = documents.map((d) => d.pageContent);

    const embeddings = await openai.embeddings.create({
      input: contentsToEmbed,
      model: process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME,
    });

    if (debug) console.log("Embeddings received:", embeddings);

    embeddings.data.forEach((embedding, index) => {
      documents[index].embedding = embedding.embedding;
    });

    if (debug) console.log("Documents after embedding:", documents);
    return {
      status: "OK",
      response: documents,
    };
  } catch (e) {
    console.error("EmbedDocuments error:", e);
    return {
      status: "ERROR",
      errors: [
        {
          message: `${e}`,
        },
      ],
    };
  }
};

export const EnsureIndexIsCreated = async (): Promise<
  ServerActionResponse<SearchIndex>
> => {
  try {
    console.log("Ensuring index is created: ", process.env.AZURE_SEARCH_INDEX_NAME);
    const client = AzureAISearchIndexClientInstance();
    const result = await client.getIndex(process.env.AZURE_SEARCH_INDEX_NAME);
    console.log("Index exists: ", result);
    return {
      status: "OK",
      response: result,
    };
  } catch (e) {
    console.log(`Error Creating index:${e}`);
    return await CreateSearchIndex();
  }
};

const CreateSearchIndex = async (): Promise<
  ServerActionResponse<SearchIndex>
> => {
  try {
    console.log("Creating search index");
    const client = AzureAISearchIndexClientInstance();
    const result = await client.createIndex({
      name: process.env.AZURE_SEARCH_INDEX_NAME,
      vectorSearch: {
        algorithms: [
          {
            name: "hnsw-vector",
            kind: "hnsw",
            parameters: {
              m: 4,
              efConstruction: 200,
              efSearch: 200,
              metric: "cosine",
            },
          },
        ],
        profiles: [
          {
            name: "hnsw-vector",
            algorithmConfigurationName: "hnsw-vector",
          },
        ],
      },

      fields: [
        {
          name: "id",
          type: "Edm.String",
          key: true,
          filterable: true,
        },
        {
          name: "user",
          type: "Edm.String",
          searchable: true,
          filterable: true,
        },
        {
          name: "chatThreadId",
          type: "Edm.String",
          searchable: true,
          filterable: true,
        },
        {
          name: "personaId",
          type: "Edm.String",
          searchable: true,
          filterable: true,
        },
        {
          name: "documentId",
          type: "Edm.String",
          searchable: true,
          filterable: true,
        },
        {
          name: "pageContent",
          searchable: true,
          type: "Edm.String",
        },
        {
          name: "metadata",
          type: "Edm.String",
        },
        {
          name: "embedding",
          type: "Collection(Edm.Single)",
          searchable: true,
          filterable: false,
          sortable: false,
          facetable: false,
          vectorSearchDimensions: 1536,
          vectorSearchProfileName: "hnsw-vector",
        },
      ],
    });

    console.log("Search index created:", result);
    return {
      status: "OK",
      response: result,
    };
  } catch (e) {
    console.error("CreateSearchIndex error:", e);
    return {
      status: "ERROR",
      errors: [
        {
          message: `${e}`,
        },
      ],
    };
  }
};

export const PersonaDocumentExistsInIndex = async (
  documentId: string
): Promise<ServerActionResponse<AzureSearchDocumentIndex>> => {
  const result = await SimpleSearch(
    documentId,
    `documentId eq '${documentId}'`
  );

  if (result.status === "OK") {
    const documents = result.response;
    if (documents.length > 0) {
      return {
        status: "OK",
        response: documents[0].document,
      };
    } else {
      return {
        status: "NOT_FOUND",
        errors: [
          {
            message: `No document found with id ${documentId}`,
          },
        ],
      };
    }
  }

  return {
    status: "ERROR",
    errors: [
      {
        message: `Unexpected error occurred while checking persona document index.`,
      },
    ],
  };
};

export const DeleteDocumentByPersonaDocumentId = async (
  documentId: string
): Promise<ServerActionResponse<boolean>> => {
  try {
    // Find the document using personaDocumentId
    const documentResponse = await SimpleSearch(
      undefined,
      `documentId eq '${documentId}' and user eq '${await userHashedId()}'`
    );

    if (
      documentResponse.status === "OK" &&
      documentResponse.response.length > 0
    ) {
      const documents = documentResponse.response.map((r) => r.document);
      const instance = AzureAISearchInstance();

      const deletedResponse = await instance.deleteDocuments(documents);

      if (deletedResponse.results.every((r) => r.succeeded)) {
        return {
          status: "OK",
          response: true,
        };
      } else {
        return {
          status: "ERROR",
          errors: deletedResponse.results
            .filter((r) => !r.succeeded)
            .map((r) => ({
              message: r.errorMessage || "Unknown error",
            })),
        };
      }
    } else {
      return {
        status: "ERROR",
        errors: [
          {
            message: `No document found with personaDocumentId: ${documentId}`,
          },
        ],
      };
    }
  } catch (e) {
    return {
      status: "ERROR",
      errors: [
        {
          message: `${e}`,
        },
      ],
    };
  }
};
