
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
    const response = await fetch(
      `https://chaturbate.com/api/chatvideocontext/${encodeURIComponent(username)}/`,
      {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://chaturbate.com/"
        },
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) {
      console.error("Chaturbate HTTP:", response.status);

      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "Chaturbate API returned HTTP " + response.status
        })
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        room_status: data.room_status || "unknown"
      })
    };

  } catch (err) {
    console.error("Chaturbate error:", err);

    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        error: err.message
      })
    };
  }
};
