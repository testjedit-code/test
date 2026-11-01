exports.handler = async function (event) {
  const wm = process.env.CB_WM_ID;

  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };

  const reply = (statusCode, data) => ({
    statusCode,
    headers,
    body: JSON.stringify(data)
  });

  if (!wm) {
    return reply(500, {
      error: "CB_WM_ID ontbreekt in Netlify"
    });
  }

  const params = new URLSearchParams(
    event.queryStringParameters || {}
  );

  const requested = (
    params.get("usernames") ||
    params.get("username") ||
    ""
  )
    .split(",")
    .map(name => name.trim().toLowerCase())
    .filter(Boolean);

  if (requested.length === 0 || requested.length > 150) {
    return reply(400, {
      error: "Geef 1 tot 150 gebruikersnamen op via username of usernames."
    });
  }

  try {
    const statuses = Object.fromEntries(
      requested.map(name => [name, "unknown"])
    );

    const found = new Set();

    const baseUrl =
      "https://chaturbate.com/api/public/affiliates/onlinerooms/";

    const pageSize = 500;
    const maxPages = 20;

    let complete = false;

    for (let page = 0; page < maxPages; page++) {
      const url = new URL(baseUrl);

      url.searchParams.set("wm", wm);
      url.searchParams.set("client_ip", "request_ip");
      url.searchParams.set("limit", String(pageSize));
      url.searchParams.set("offset", String(page * pageSize));

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0"
        },
        signal: AbortSignal.timeout(15000)
      });

      const body = await response.text();

      if (!response.ok) {
        return reply(502, {
          error: "Chaturbate HTTP " + response.status,
          details: body.slice(0, 500)
        });
      }

      let data;

      try {
        data = JSON.parse(body);
      } catch {
        return reply(502, {
          error: "Chaturbate stuurde geen geldige JSON terug.",
          details: body.slice(0, 300)
        });
      }

      if (data.errors) {
        return reply(502, {
          error: "Chaturbate API heeft de parameters geweigerd.",
          details: data.errors
        });
      }

      if (!Array.isArray(data.results)) {
        return reply(502, {
          error: "Ongeldig antwoord: results ontbreekt in Chaturbate-response."
        });
      }

      for (const room of data.results) {
        const name = String(room.username || "").toLowerCase();

        if (!requested.includes(name)) {
          continue;
        }

        found.add(name);

        const show = String(
          room.current_show || ""
        ).toLowerCase();

        if (["public", "private", "group", "away"].includes(show)) {
          statuses[name] = show;
        } else {
          statuses[name] = "unknown";
        }
      }

      // Een kortere pagina betekent dat de feed volledig is doorlopen.
      if (data.results.length < pageSize) {
        complete = true;
        break;
      }

      // Alle gevraagde modellen zijn gevonden.
      if (found.size === requested.length) {
        complete = true;
        break;
      }
    }

    // Alleen als de feed volledig is doorlopen, mogen niet-gevonden
    // namen als offline worden weergegeven.
    if (complete) {
      for (const name of requested) {
        if (!found.has(name)) {
          statuses[name] = "offline";
        }
      }
    }

    return reply(200, {
      success: true,
      statuses,
      complete
    });

  } catch (error) {
    return reply(502, {
      error: error.name === "TimeoutError"
        ? "Chaturbate API reageert te langzaam."
        : (
            error.message ||
            "Onbekende fout bij de Chaturbate API."
          )
    });
  }
};
