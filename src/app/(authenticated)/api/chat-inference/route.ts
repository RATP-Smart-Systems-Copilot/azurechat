import { ChatApiAIInference } from "@/features/chat-page/chat-services/chat-api/chat-api-ai-inference";
import { UserPrompt } from "@/features/chat-page/chat-services/models";

export async function POST(req: Request) {
  const formData = await req.formData();
  const content = formData.get("content") as unknown as string;
  const multimodalImage = formData.get("image-base64") as unknown as string;

  const userPrompt: UserPrompt = {
    ...JSON.parse(content),
    multimodalImage,
  };

  return await ChatApiAIInference(userPrompt, req.signal);
}
