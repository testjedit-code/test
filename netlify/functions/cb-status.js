
exports.handler = async function(event) {
  const username = event.queryStringParameters?.username;

  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };

  if (!username || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid username" })
    };
  }

  try {
    // Test het alternatieve bio-endpoint
    const url = `https://chaturbate.com/api/biocontext/${encodeURIComponent(username)}/`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
        "Referer": "https://chaturbate.com/"
      },
      signal: AbortSignal.timeout(10000)
    });

    const body = await response.text();

    console.log("Username:", username);
    console.log("Chaturbate HTTP:", response.status);
    console.log("Response:", body.substring(0, 500));

    if (!response.ok) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "Chaturbate HTTP " + response.status,
          upstream_status: response.status
        })
      };
    }

    const data = JSON.parse(body);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        room_status: data.room_status || "unknown"
      })
    };

  } catch (err) {
    console.error("Function error:", err);

    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        error: err.message
      })
    };
  }
};
