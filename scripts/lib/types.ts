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

/**
 * Hand-verified access facts from data/access.json: what it costs, whether and how
 * you get a key, and what the free allowance really is. Upstream lists only say
 * "apiKey" or "No", which cannot tell a free signup from a £2,250-a-year contract.
 */
export const AccessSchema = z.object({
  pricing: z.enum(['free', 'free-tier', 'restricted', 'application', 'paid', 'discontinued']),
  key: z.enum(['none', 'optional', 'free', 'application', 'paid', 'closed']),
  /** Corrects upstream when it is wrong, e.g. AniList listed as OAuth for public data. */
  auth: AuthSchema.optional(),
  /** Replaces a documentation URL that has moved or died. */
  url: z.string().url().optional(),
  summary: z.string().min(1),
  freeLimits: z.string().optional(),
  keyUrl: z.string().url().optional(),
  keySteps: z.array(z.string()).optional(),
  keyUsage: z.string().optional(),
  paidFrom: z.string().optional(),
  discontinuedOn: z.string().optional(),
  alternatives: z.array(z.string()).optional(),
  sources: z.array(z.object({ label: z.string(), url: z.string().url() })).min(1),
  verified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type Access = z.infer<typeof AccessSchema>;

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
  health: HealthSchema.optional(),
  status: z.enum(['live', 'down', 'unchecked', 'discontinued']),
  access: AccessSchema.optional(),
});
export type Api = z.infer<typeof ApiSchema>;

export const CategorySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
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
  health?: z.infer<typeof HealthSchema>;
};
