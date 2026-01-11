// Supabase Edge Function (Deno runtime)
// Receives { columns: string[], project?: {id,name} }
// Returns mapping suggestions using OpenAI

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // ✅ Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("[ai-suggest] OPTIONS preflight");
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // ✅ Authentication check
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Verify JWT using Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: "Supabase not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.log("[ai-suggest] Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const userId = userData.user.id;
    console.log("[ai-suggest] Authenticated user:", userId);

    const body = await req.json().catch(() => ({}));

    console.log(
      "[ai-suggest] POST body preview",
      JSON.stringify(body).slice(0, 500)
    );

    const columns: string[] = body.columns ?? [];
    const project = body.project ?? {};

    // ✅ Input validation
    if (!Array.isArray(columns) || columns.length === 0) {
      return new Response(JSON.stringify({ error: "columns required" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Limit number of columns to prevent abuse
    if (columns.length > 100) {
      return new Response(
        JSON.stringify({ error: "Too many columns (max 100)" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate each column
    for (const col of columns) {
      if (typeof col !== "string" || col.length > 200) {
        return new Response(
          JSON.stringify({ error: "Invalid column format" }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const prompt = `
You are an expert data engineer.

Source columns:
${JSON.stringify(columns, null, 2)}

Suggest exactly 3 target field mappings.
Each item must contain:
- name
- suggestedTransformation
- justification

Return ONLY valid JSON in this format:
{
  "suggestions": [
    {
      "name": "",
      "suggestedTransformation": "",
      "justification": ""
    }
  ]
}
`;

    const openAiPayload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You generate clean JSON mapping suggestions. No markdown.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 600,
    };

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(openAiPayload),
    });

    if (!aiRes.ok) {
      const details = await aiRes.text();
      console.log("[ai-suggest] OpenAI error", aiRes.status, details);
      return new Response(
        JSON.stringify({ error: "OpenAI request failed", details }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const aiData = await aiRes.json();
    const text = aiData?.choices?.[0]?.message?.content ?? "";

    let suggestions = [];

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed?.suggestions)) {
        suggestions = parsed.suggestions;
      }
    } catch {
      suggestions = [
        {
          name: "Fallback Mapping",
          suggestedTransformation: "Manual review required",
          justification: text.slice(0, 200),
        },
      ];
    }

    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.log("[ai-suggest] Unexpected error", err);
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
