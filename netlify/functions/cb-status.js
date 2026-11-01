exports.handler = async function(event) {
  const username = event.queryStringParameters.username;

  if (!username) {
    return { statusCode: 400, body: "Missing username" };
  }

  try {
    const response = await fetch(`https://chaturbate.com/api/chatvideocontext/${username}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Referer": "https://chaturbate.com/"
      }
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        room_status: data.room_status || "offline"
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
