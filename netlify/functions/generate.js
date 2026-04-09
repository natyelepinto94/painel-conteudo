exports.handler = async function(event, context) {
const headers = {
“Access-Control-Allow-Origin”: “*”,
“Access-Control-Allow-Headers”: “Content-Type”,
“Access-Control-Allow-Methods”: “POST, OPTIONS”,
“Content-Type”: “application/json”,
};

if (event.httpMethod === “OPTIONS”) {
return { statusCode: 200, headers, body: “” };
}

if (event.httpMethod !== “POST”) {
return { statusCode: 405, headers, body: JSON.stringify({ error: “Method not allowed” }) };
}

try {
const { prompt, system } = JSON.parse(event.body);
const apiKey = process.env.GEMINI_API_KEY;

```
if (!apiKey) {
  return {
    statusCode: 500,
    headers,
    body: JSON.stringify({ error: "GEMINI_API_KEY não configurada. Vá em Site Settings > Environment Variables na Netlify." }),
  };
}

const fullPrompt = system ? `${system}\n\n${prompt}` : `Responda apenas em JSON puro, sem markdown, sem backticks.\n\n${prompt}`;

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 800 },
    }),
  }
);

if (!response.ok) {
  const err = await response.text();
  return { statusCode: 500, headers, body: JSON.stringify({ error: `Erro Gemini: ${response.status} — ${err}` }) };
}

const data = await response.json();
const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
const clean = text.replace(/```json|```/g, "").trim();

let parsed;
try {
  parsed = JSON.parse(clean);
} catch {
  return { statusCode: 500, headers, body: JSON.stringify({ error: "Resposta inválida da IA", raw: text }) };
}

return { statusCode: 200, headers, body: JSON.stringify(parsed) };
```

} catch (err) {
return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || “Erro desconhecido” }) };
}
};
