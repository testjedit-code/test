
exports.handler = async function(event) {
  const wm = process.env.CB_WM_ID;

  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };

  if (!wm) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "CB_WM_ID ontbreekt in Netlify"
      })
    };
  }

  try {
    const url = new URL(
      "https://chaturbate.com/api/public/affiliates/onlinerooms/"
    );

    url.searchParams.set("wm", wm);
    url.searchParams.set("client_ip", "request_ip");
    url.searchParams.set("limit", "1");
    url.searchParams.set("offset", "0");

    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      signal: AbortSignal.timeout(15000)
    });

    const body = await response.text();

    if (!response.ok) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "Chaturbate HTTP " + response.status,
          details: body.substring(0, 500)
        })
      };
    }

    const data = JSON.parse(body);

    if (data.errors) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "Chaturbate API parameters rejected",
          details: data.errors
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Chaturbate API bereikbaar!",
        result_count: data.results?.length ?? 0,
        sample: data.results?.[0]?.username ?? null,
        current_show: data.results?.[0]?.current_show ?? null
      })
    };

  } catch (error) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
