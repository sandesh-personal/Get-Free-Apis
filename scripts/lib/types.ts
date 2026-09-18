import { z } from 'zod';

/** Authentication requirement, normalised from the wildly inconsistent upstream values. */
export const AuthSchema = z.enum(['none', 'apiKey', 'oauth', 'other']);
export type Auth = z.infer<typeof AuthSchema>;

/** CORS support. Over half the upstream catalogue says "Unknown"; we resolve those ourselves later. */
export const CorsSchema = z.enum(['yes', 'no', 'unknown']);
export type Cors = z.infer<typeof CorsSchema>;

export const HealthSchema = z.object({
  score: z.number().min(0).max(100),
  reliability: z.number().min(0).max(100),
  latencyMs: z.number().nonnegative(),
  lastChecked: z.string(),
});

export const ApiSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  category: z.string().min(1),
  categorySlug: z.string().min(1),
  url: z.string().url(),
  auth: AuthSchema,
  https: z.boolean(),
  cors: CorsSchema,
  sources: z.array(z.string()).min(1),
  emoji: z.string().optional(),
  health: HealthSchema.optional(),
  status: z.enum(['live', 'down', 'unchecked']),
});
export type Api = z.infer<typeof ApiSchema>;

export const CategorySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  emoji: z.string(),
  count: z.number().int().nonnegative(),
});
export type Category = z.infer<typeof CategorySchema>;

export const CatalogueSchema = z.object({
  generatedAt: z.string(),
  total: z.number().int().positive(),
  sources: z.record(z.string(), z.number()),
  apis: z.array(ApiSchema),
});
export type Catalogue = z.infer<typeof CatalogueSchema>;

/** A row as scraped, before merge. */
export type RawEntry = {
  name: string;
  description: string;
  category: string;
  url: string;
  auth: Auth;
  https: boolean;
  cors: Cors;
  source: string;
  emoji?: string;
  health?: z.infer<typeof HealthSchema>;
};
