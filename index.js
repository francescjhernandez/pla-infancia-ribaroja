export default {
  async fetch(request, env) {
    // Capçaleres CORS permissives per a evitar el 'Failed to fetch'
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };

    // Resposta ràpida per a les peticions prèvies de verificació CORS (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Filtrar mètodes no permesos
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: { message: "Només s'accepten peticions POST" } }), 
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    try {
      const rawBody = await request.text();
      if (!rawBody) {
        return new Response(
          JSON.stringify({ error: { message: "El cos de la petició està buit" } }), 
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      const body = JSON.parse(rawBody);

      if (!env.GEMINI_API_KEY) {
        return new Response(
          JSON.stringify({ error: { message: "Falta la variable GEMINI_API_KEY en Cloudflare" } }), 
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      // Endpoint estable de Gemini
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;

      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (err) {
      return new Response(
        JSON.stringify({ error: { message: err.message } }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  },
};
