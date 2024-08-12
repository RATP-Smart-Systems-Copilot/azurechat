import { refineFromEmpty } from "@/features/common/schema-validation";
import { z } from "zod";

export const ASSISTANT_ATTRIBUTE = "assistant";
export type AssistantModel = z.infer<typeof AssistantModelSchema>;

export const AssistantModelSchema = z.object({
  id: z.string(),
  name: z.string({
      invalid_type_error: "Invalid title",
    })
    .min(1)
    .refine(refineFromEmpty, "Title cannot be empty"),
  instructions: z
    .string({
      invalid_type_error: "Invalid instructions",
    })
    .min(1)
    .refine(refineFromEmpty, "Description cannot be empty"),
  temperature: z.number({invalid_type_error: "Temperature must be a number",})
    .refine((value) => value >= 0 && value <= 2, "Temperature must be between 0 and 2"),
  top_p: z.number({invalid_type_error: "Top P must be a number",})
  .refine((value) => value >= 0 && value <= 2, "Top P must be between 0 and 2"),
  object: z.literal(ASSISTANT_ATTRIBUTE),
  createdAt: z.date(),
  description: z
  .string({
    invalid_type_error: "Invalid description",
  })
  .min(1)
  .refine(refineFromEmpty, "Description cannot be empty"),
  model: z
  .string({
    invalid_type_error: "Invalid model",
  })
  .min(1)
  .refine(refineFromEmpty, "Model cannot be empty"),
  response_format: z
  .string({
    invalid_type_error: "Invalid response format",
  }),
});
