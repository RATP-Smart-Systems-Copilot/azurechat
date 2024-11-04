import { refineFromEmpty } from "@/features/common/schema-validation";
import { z } from "zod";

export const PERSONA_ATTRIBUTE = "PERSONA";
export const PERSONA_TEMPERATURE = 0;
export type PersonaModel = z.infer<typeof PersonaModelSchema>;

export const PersonaModelSchema = z.object({
  id: z.string(),
  userId: z.string(),
  gptModel: z.string().min(1)
  .refine(refineFromEmpty, "Vous devez choisir un modèle"),
  name: z
    .string({
      invalid_type_error: "Invalid title",
    })
    .min(1)
    .refine(refineFromEmpty, "Title cannot be empty"),
  description: z
    .string({
      invalid_type_error: "Invalid description",
    })
    .min(1)
    .refine(refineFromEmpty, "Description cannot be empty"),
  personaMessage: z
    .string({
      invalid_type_error: "Invalid persona Message",
    })
    .min(1)
    .refine(refineFromEmpty, "System message cannot be empty"),
  temperature: z.number({invalid_type_error: "Temperature must be a number",})
    .refine((value) => value >= 0 && value <= 2, "Temperature must be between 0 and 2"),
  isPublished: z.boolean(),
  type: z.literal(PERSONA_ATTRIBUTE),
  createdAt: z.date(),
  sharedWith: z.array(z.string()),
});
