import { getCurrentUser } from "@/features/auth-page/helpers";
import {
  CHAT_THREAD_ATTRIBUTE,
  ChatMessageModel,
  ChatThreadModel,
  MESSAGE_ATTRIBUTE,
} from "@/features/chat-page/chat-services/models";
import { ServerActionResponse } from "@/features/common/server-action-response";
import { HistoryContainer } from "@/features/common/services/cosmos";
import { PERSONA_ATTRIBUTE, PersonaModel } from "@/features/persona-page/persona-services/models";
import { SqlQuerySpec } from "@azure/cosmos";

export const FindAllChatThreadsForAdmin = async (
  limit: number,
  offset: number
): Promise<ServerActionResponse<Array<ChatThreadModel>>> => {
  const user = await getCurrentUser();

  if (!user.isAdmin) {
    return {
      status: "ERROR",
      errors: [{ message: "You are not authorized to perform this action" }],
    };
  }

  try {
    const querySpec: SqlQuerySpec = {
      query:
        "SELECT * FROM root r WHERE r.type=@type ORDER BY r.createdAt DESC OFFSET @offset LIMIT @limit",
      parameters: [
        {
          name: "@type",
          value: CHAT_THREAD_ATTRIBUTE,
        },
        {
          name: "@offset",
          value: offset,
        },
        {
          name: "@limit",
          value: limit,
        },
      ],
    };

    const { resources } = await HistoryContainer()
      .items.query<ChatThreadModel>(querySpec)
      .fetchAll();
    return {
      status: "OK",
      response: resources,
    };
  } catch (error) {
    return {
      status: "ERROR",
      errors: [{ message: `${error}` }],
    };
  }
};

export const FindAllChatMessagesForAdmin = async (
  chatThreadID: string
): Promise<ServerActionResponse<Array<ChatMessageModel>>> => {
  const user = await getCurrentUser();

  if (!user.isAdmin) {
    return {
      status: "ERROR",
      errors: [{ message: "You are not authorized to perform this action" }],
    };
  }

  try {
    const querySpec: SqlQuerySpec = {
      query:
        "SELECT * FROM root r WHERE r.type=@type AND r.threadId = @threadId ORDER BY r.createdAt ASC",
      parameters: [
        {
          name: "@type",
          value: MESSAGE_ATTRIBUTE,
        },
        {
          name: "@threadId",
          value: chatThreadID,
        },
      ],
    };

    const { resources } = await HistoryContainer()
      .items.query<ChatMessageModel>(querySpec)
      .fetchAll();

    return {
      status: "OK",
      response: resources,
    };
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

export const CountAllChatThreadsForAdmin = async (
): Promise<ServerActionResponse<number>> => {
  const user = await getCurrentUser();

  if (!user.isAdmin) {
    return {
      status: "ERROR",
      errors: [{ message: "You are not authorized to perform this action" }],
    };
  }

  try {
    const querySpec: SqlQuerySpec = {
      query:
        "SELECT VALUE count(1) FROM root r WHERE r.type=@type ORDER BY r.createdAt DESC",
      parameters: [
        {
          name: "@type",
          value: CHAT_THREAD_ATTRIBUTE,
        },
      ],
    };

    const { resources } = await HistoryContainer()
      .items.query<number>(querySpec)
      .fetchAll();
    return {
      status: "OK",
      response: resources[0],
    };
  } catch (error) {
    return {
      status: "ERROR",
      errors: [{ message: `${error}` }],
    };
  }
};

export const CountAllUsersForAdmin = async (
): Promise<ServerActionResponse<number>> => {
  const user = await getCurrentUser();

  if (!user.isAdmin) {
    return {
      status: "ERROR",
      errors: [{ message: "You are not authorized to perform this action" }],
    };
  }

  try {
    const querySpec: SqlQuerySpec = {
      query:
        "SELECT VALUE count(1) FROM (SELECT DISTINCT r.useName from root r WHERE r.type=@type) as u",
      parameters: [
        {
          name: "@type",
          value: CHAT_THREAD_ATTRIBUTE,
        },
      ],
    };

    const { resources } = await HistoryContainer()
      .items.query<number>(querySpec)
      .fetchAll();
    return {
      status: "OK",
      response: resources[0],
    };
  } catch (error) {
    return {
      status: "ERROR",
      errors: [{ message: `${error}` }],
    };
  }
};

interface User{
  useName: string;
  userId: string;
  chats: number;
}

export const FindAllUsersForAdmin = async (
  limit: number,
  offset: number
): Promise<ServerActionResponse<Array<User>>> => {
  const user = await getCurrentUser();

  if (!user.isAdmin) {
    return {
      status: "ERROR",
      errors: [{ message: "You are not authorized to perform this action" }],
    };
  }

  try {
    const querySpec: SqlQuerySpec = {
      query:
        "SELECT r.useName, r.userId, count(1) as chats FROM root r WHERE r.type=@type GROUP BY r.useName, r.userId ORDER BY r.useName DESC OFFSET @offset LIMIT @limit",
      parameters: [
        {
          name: "@type",
          value: CHAT_THREAD_ATTRIBUTE,
        },
        {
          name: "@offset",
          value: offset,
        },
        {
          name: "@limit",
          value: limit,
        },
      ],
    };

    const { resources } = await HistoryContainer()
      .items.query<User>(querySpec)
      .fetchAll();
    return {
      status: "OK",
      response: resources,
    };
  } catch (error) {
    return {
      status: "ERROR",
      errors: [{ message: `${error}` }],
    };
  }
};

export const FindAllPersonaForAdmin = async (
  limit: number,
  offset: number
): Promise<ServerActionResponse<Array<PersonaModel>>> => {
  const user = await getCurrentUser();

  if (!user.isAdmin) {
    return {
      status: "ERROR",
      errors: [{ message: "You are not authorized to perform this action" }],
    };
  }

  try {
    const querySpec: SqlQuerySpec = {
      query:
        "SELECT * FROM root r WHERE r.type=@type ORDER BY r.createdAt DESC OFFSET @offset LIMIT @limit",
      parameters: [
        {
          name: "@type",
          value: PERSONA_ATTRIBUTE,
        },
        {
          name: "@offset",
          value: offset,
        },
        {
          name: "@limit",
          value: limit,
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
      errors: [{ message: `${error}` }],
    };
  }
};

export const CountAllPersonaForAdmin = async (
): Promise<ServerActionResponse<number>> => {
  const user = await getCurrentUser();

  if (!user.isAdmin) {
    return {
      status: "ERROR",
      errors: [{ message: "You are not authorized to perform this action" }],
    };
  }

  try {
    const querySpec: SqlQuerySpec = {
      query:
        "SELECT VALUE count(1) FROM root r WHERE r.type=@type",
      parameters: [
        {
          name: "@type",
          value: PERSONA_ATTRIBUTE,
        },
      ],
    };

    const { resources } = await HistoryContainer()
      .items.query<number>(querySpec)
      .fetchAll();
    return {
      status: "OK",
      response: resources[0],
    };
  } catch (error) {
    return {
      status: "ERROR",
      errors: [{ message: `${error}` }],
    };
  }
};

export const FindPersonaForAdmin = async (
  personaID: string
): Promise<ServerActionResponse<Array<PersonaModel>>> => {
  const user = await getCurrentUser();

  if (!user.isAdmin) {
    return {
      status: "ERROR",
      errors: [{ message: "You are not authorized to perform this action" }],
    };
  }

  try {
    const querySpec: SqlQuerySpec = {
      query:
        "SELECT * FROM root r WHERE r.type=@type AND r.id = @personaID ORDER BY r.createdAt ASC",
      parameters: [
        {
          name: "@type",
          value: PERSONA_ATTRIBUTE,
        },
        {
          name: "@personaID",
          value: personaID,
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
