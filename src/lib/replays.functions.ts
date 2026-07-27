import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function createPublicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const listFiltersSchema = z
  .object({
    role: z.string().optional(),
    hero: z.string().optional(),
    rank: z.string().optional(),
    division: z.coerce.number().int().min(1).max(5).optional(),
    map: z.string().optional(),
    result: z.enum(["Win", "Loss"]).optional(),
    q: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .default({});

export const listReplays = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => listFiltersSchema.parse(data ?? {}))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    let q = supabase
      .from("replays")
      .select("id, role, hero, rank, division, replay_code, map, result, notes, submitter_ign, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.role) q = q.eq("role", data.role);
    if (data.hero) q = q.eq("hero", data.hero);
    if (data.rank) q = q.eq("rank", data.rank);
    if (data.division) q = q.eq("division", data.division);
    if (data.map) q = q.eq("map", data.map);
    if (data.result) q = q.eq("result", data.result);
    if (data.q) q = q.or(`notes.ilike.%${data.q}%,submitter_ign.ilike.%${data.q}%,replay_code.ilike.%${data.q}%`);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { replays: rows ?? [] };
  });

export const getReplay = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const [{ data: replay, error: rErr }, { data: comments, error: cErr }] = await Promise.all([
      supabase.from("replays").select("*").eq("id", data.id).maybeSingle(),
      supabase
        .from("comments")
        .select("id, author_ign, body, created_at")
        .eq("replay_id", data.id)
        .order("created_at", { ascending: true }),
    ]);
    if (rErr) throw new Error(rErr.message);
    if (cErr) throw new Error(cErr.message);
    if (!replay) throw new Error("Replay not found");
    return { replay, comments: comments ?? [] };
  });

const createReplaySchema = z.object({
  role: z.enum(["Tank", "Damage", "Support"]),
  hero: z.string().min(1).max(50),
  rank: z.enum(["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster", "Champion"]),
  division: z.coerce.number().int().min(1).max(5),
  replay_code: z
    .string()
    .trim()
    .min(3)
    .max(20)
    .regex(/^[A-Za-z0-9]+$/, "Replay code must be letters and digits only"),
  map: z.string().min(1).max(50),
  result: z.enum(["Win", "Loss"]),
  notes: z.string().max(1000).default(""),
});

export const createReplay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createReplaySchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("ign")
      .eq("id", context.userId)
      .maybeSingle();
    const ign = profile?.ign ?? "player";
    const { data: row, error } = await context.supabase
      .from("replays")
      .insert({ ...data, submitter_id: context.userId, submitter_ign: ign })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

const createCommentSchema = z.object({
  replay_id: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

export const createComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createCommentSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("ign")
      .eq("id", context.userId)
      .maybeSingle();
    const ign = profile?.ign ?? "player";
    const { data: row, error } = await context.supabase
      .from("comments")
      .insert({
        replay_id: data.replay_id,
        author_id: context.userId,
        author_ign: ign,
        body: data.body,
      })
      .select("id, author_ign, body, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { comment: row };
  });
