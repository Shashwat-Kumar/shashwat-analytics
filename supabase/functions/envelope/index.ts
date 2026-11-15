// Entry point for the Supabase Edge Function "envelope". Logic lives in handler.ts.
import { handle } from "./handler.ts";

Deno.serve(handle);
