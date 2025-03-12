import {
  GetImageFromStore,
  GetThreadAndImageFromUrl,
} from "./chat-image-service";

export const ImageAPIEntry = async (request: Request): Promise<Response> => {
  const urlPath = request.url;

  const response = await GetThreadAndImageFromUrl(urlPath);

  if (response.status !== "OK") {
    const errorMessage = response.errors && response.errors.length > 0 
    ? response.errors[0].message 
    : "Une erreur inconnue s'est produite.";
    return new Response(errorMessage, { status: 404 });
  }

  const { threadId, imgName } = response.response;
  const imageData = await GetImageFromStore(threadId, imgName);

  if (imageData.status === "OK") {
    return new Response(imageData.response, {
      headers: { "content-type": "image/png" },
    });
  } else {
    return new Response(imageData.errors[0].message, { status: 404 });
  }
};
