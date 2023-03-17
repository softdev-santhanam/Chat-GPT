const express = require("express");
const { Configuration, OpenAIApi } = require("openai");
const app = express();
const cors = require("cors");
require("dotenv").config();
const fs = require("fs");
const fileName = "file-eon5qb5SmxHbH7BYaS16ghLC";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const model = "curie:ft-personal-2023-03-15-02-50-26";

const response = openai.createCompletion({
  model,
  prompt: "how many years of experience chennai packers have?",
  temperature: 0,
  max_tokens: 256,
  top_p: 0,
  frequency_penalty: 0,
  presence_penalty: 0,
  stop: ["END"],
});

response
  .then((data) => {
    console.log(data.data.choices[0].text);
  })
  .catch((err) => {
    console.log(err);
  });

app.use(cors());
app.use(express.json());
app.use("/", express.static(__dirname + "/frontend")); // Serves resources from client folder

app.post("/get-prompt-result", async (req, res) => {
  // Get the prompt from the request body
  const { prompt, model = "gpt" } = req.body;
  // console.log(model);

  // Check if prompt is present in the request
  if (!prompt) {
    // Send a 400 status code and a message indicating that the prompt is missing
    return res.status(400).send({ error: "Prompt is missing in the request" });
  }

  try {
    // Use the OpenAI SDK to create a completion
    // with the given prompt, model and maximum tokens
    if (model === "image") {
      const result = await openai.createImage({
        prompt,
        response_format: "url",
        size: "512x512",
      });
      return res.send(result.data.data[0].url);
    }

    const completion = await openai.createCompletion({
      model:
        model === "gpt"
          ? "davinci:ft-personal-2023-03-15-06-22-08"
          : "davinci-codex",
      prompt: prompt,
      temperature: 0,
      max_tokens: 256,
      top_p: 0,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: ["END"],
    });
    // Send the generated text as the response
    return res.send(completion.data.choices[0].text);
  } catch (error) {
    const errorMsg = error.response ? error.response.data.error : `${error}`;
    console.error(errorMsg);
    // Send a 500 status code and the error message as the response
    return res.status(500).send(errorMsg);
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Listening on port ${port}`));
