
exports.handler = async function(event) {
  const username = event.queryStringParameters?.username;

  if (!username || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid username" })
    };
  }

  try {
    const response = await fetch(
      `https://chaturbate.com/api/biocontext/${encodeURIComponent(username)}/`,
      {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0",
          "Referer": `https://chaturbate.com/${username}/`
        }
      }
    );

    const body = await response.text();

    if (!response.ok) {
      console.error("Chaturbate HTTP error:", username, response.status, body.slice(0, 300));

      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Chaturbate HTTP error",
          upstreamStatus: response.status
        })
      };
    }

    let data;

    try {
      data = JSON.parse(body);
    } catch {
      throw new Error("Chaturbate returned invalid JSON: " + body.slice(0, 200));
    }

    if (!data.room_status) {
      console.error("Missing room_status:", username, data);

      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "Missing room_status",
          response: data
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        username,
        room_status: data.room_status
      })
    };

  } catch (err) {
    console.error("Function error:", username, err);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: err.message
      })
    };
  }
};
