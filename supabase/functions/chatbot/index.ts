import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const messages = body.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('gemini_api_key')
      .single();

    if (apiKeyError || !apiKeyData?.gemini_api_key) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not found" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch products from Supabase
    const { data: products, error: productError } = await supabase
      .from('Produits')
      .select(`*`);

    if (productError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch products", details: productError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch utilization data from Supabase
    const { data: utilizations, error: utilizationError } = await supabase
      .from('utilisation')
      .select(`*`);

    if (utilizationError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch utilization data", details: utilizationError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter products with all the necessary columns
    const validProducts = products.filter((product: any) =>
      product['Produits'] &&
      product['Détenteur'] &&
      product['Fournisseur'] &&
      product['Numéro homologation'] &&
      product['Valable jusqu\'au'] &&
      product['Tableau toxicologique'] &&
      product['Categorie'] &&
      product['Formulation'] &&
      product['Matière active'] &&
      product['Teneur']
    );

    if (validProducts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid products with all required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare a message with products and utilization
    const productUtilizationList = validProducts.map((product: any) => {
      // Find the corresponding utilization data for the product
      const utilization = utilizations.filter((u: any) =>
        normalizeString(u['Produits']) === normalizeString(product['Produits'])
      );
      
      const utilizationDetails = utilization.map((u: any) => 
        `Cible: ${u['Cible']}, 
         Cultures: ${u['Cultures']}, 
         Dose: ${u['Dose']}, 
         Utilisation: ${u['utilisation']}, 
         DAR: ${u['DAR']}, 
         Nbr d'app: ${u['Nbr_d\'app']}`
      ).join('\n') || "Pas d'informations d'utilisation disponibles.";

      return `Produits: ${product['Produits']}
        Détenteur: ${product['Détenteur']}
        Fournisseur: ${product['Fournisseur']}
        Numéro homologation: ${product['Numéro homologation']}
        Valable jusqu'au: ${product['Valable jusqu\'au']}
        Tableau toxicologique: ${product['Tableau toxicologique']}
        Categorie: ${product['Categorie']}
        Formulation: ${product['Formulation']}
        Matière active: ${product['Matière active']}
        Teneur: ${product['Teneur']}
        Utilisation : ${utilizationDetails}`;
    }).join('\n\n');

    const contextMessage = {
      role: 'user',
      parts: [{
        text: `Voici la liste des produits disponibles avec leurs informations d'utilisation :\n${productUtilizationList}\n\nUtilisez ces informations pour répondre aux questions suivantes.`
      }]
    };

    // Prepare messages for the Gemini API
    const formattedMessages = [
      contextMessage,
      ...messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        parts: [{ text: msg.content }]
      }))
    ];

    // Send the data to Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeyData.gemini_api_key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(
        JSON.stringify({ error: "Gemini API error", details: errorData }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";
    const normalizedResponse = normalizeString(responseText);

    return new Response(
      JSON.stringify({ response: responseText, normalizedResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
