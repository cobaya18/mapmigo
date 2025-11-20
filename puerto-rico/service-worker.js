export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/places") {
      return await fetchPlaces(env);
    }

    return new Response("Not found", { status: 404 });
  }
};

async function fetchPlaces(env) {
  const supabaseUrl = env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  const endpoint = `${supabaseUrl}/rest/v1/places?select=*`;

  const res = await fetch(endpoint, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`
    }
  });

  if (!res.ok) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch from Supabase" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
