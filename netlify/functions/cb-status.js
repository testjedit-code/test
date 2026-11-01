exports.handler = async function(event) {
  const username = event.queryStringParameters?.username;

  if (!username) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing username" })
    };
  }

  try {
    const response = await fetch(`https://chaturbate.com/api/chatvideocontext/${username}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://chaturbate.com/",
        "Origin": "https://chaturbate.com"
      }
    });

    if (!response.ok) {
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ room_status: "offline" })
      };
    }

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
    console.error("Error for", username, err.message);

    return {
      statusCode: 200, // we sturen toch 200 terug zodat de frontend niet crasht
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ room_status: "error" })
    };
  }
};
