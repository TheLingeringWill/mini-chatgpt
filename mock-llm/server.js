const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());

function randomInt(n) {
  return Math.floor(Math.random() * n);
}

app.post("/complete", async (req, res) => {
  if (Math.random() < 0.1) return; // hang forever
  if (Math.random() < 0.2)
    return res.status(500).json({ error: "mock-llm failure" });
  const content = (req.body && req.body.content) || "";
  console.log("Mock LLM got:", content);
  const reply = "This is a mock response from a pretend LLM.";
  const delayMs = 500 + randomInt(1500);
  await new Promise((r) => setTimeout(r, delayMs));
  return res.json({ completion: reply });
});

app.listen(8080, () => console.log("mock-llm listening on 8080"));
