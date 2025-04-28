"use server";
import "server-only";

import { ServerActionResponse } from "@/features/common/server-action-response"; // adapt selon ton path
import { FindAllExtensionForCurrentUser, FindSecureHeaderValue } from "@/features/extensions-page/extension-services/extension-service";
import { userHashedId } from "@/features/auth-page/helpers";
import { ToolsInterface } from "../models"; // ton interface
import { ExtensionFunctionModel, ExtensionModel } from "@/features/extensions-page/extension-services/models";

export const GetDynamicExtensions = async (props: {
  extensionIds: string[];
}): Promise<ServerActionResponse<any[]>> => {
  const extensionResponse = await FindAllExtensionForCurrentUser();

  if (extensionResponse.status === "OK") {
    const extensionToReturn = extensionResponse.response.filter((e) =>
      props.extensionIds.includes(e.id)
    );

    const dynamicExtensions: any[] = [];

    extensionToReturn.forEach((e) => {
      e.functions.forEach((f) => {
        const extension = JSON.parse(f.code) as ToolsInterface;
        dynamicExtensions.push({
          type: "function",
          name: extension.name,
          description: extension.description,
          parameters: extension.parameters,
          function: {
            execute: async (args: any) => {
              return executeFunction({
                functionModel: f,
                extensionModel: e,
                args,
              });
            },
          },
        });
      });
    });

    return {
      status: "OK",
      response: dynamicExtensions,
    };
  }

  return extensionResponse;
};

async function executeFunction(props: {
  functionModel: ExtensionFunctionModel;
  extensionModel: ExtensionModel;
  args: any;
}) {
  try {
    const { functionModel, args, extensionModel } = props;

    const headerItems = await Promise.all(
      extensionModel.headers.map(async (h) => {
        const headerValue = await FindSecureHeaderValue(h.id);
        return {
          id: h.id,
          key: h.key,
          value: headerValue.status === "OK" ? headerValue.response : "***",
        };
      })
    );

    headerItems.push({
      id: "authorization",
      key: "authorization",
      value: await userHashedId(),
    });

    const headers = headerItems.reduce((acc, header) => {
      acc[header.key] = header.value;
      return acc;
    }, {} as Record<string, string>);

    if (args.query) {
      for (const key in args.query) {
        const value = args.query[key];
        functionModel.endpoint = functionModel.endpoint.replace(`${key}`, value);
      }
    }

    const requestInit: RequestInit = {
      method: functionModel.endpointType,
      headers,
      cache: "no-store",
    };

    if (args.body) {
      requestInit.body = JSON.stringify(args.body);
    }

    const response = await fetch(functionModel.endpoint, requestInit);

    if (!response.ok) {
      return `Error calling API: ${response.statusText}`;
    }

    const result = await response.json();
    return { id: functionModel.id, result };
  } catch (error) {
    console.error("🔴 Error executing function:", error);
    return `Error: ${error}`;
  }
}
