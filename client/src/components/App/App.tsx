import { useState } from "react";
import axios from "axios";
import PromptInput from "../PromptInput/PromptInput";
import "./App.scss";
import { ResponseInterface } from "../PromptResponseList/response-interface";
import PromptResponseList from "../PromptResponseList/PromptResponseList";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import Logo from "../../img/lystloc_logo.png";

type ModelValueType = "gpt" | "codex" | "image";
const App = () => {
  const [responseList, setResponseList] = useState<ResponseInterface[]>([]);
  const [prompt, setPrompt] = useState<string>("");
  const [promptToRetry, setPromptToRetry] = useState<string | null>(null);
  const [uniqueIdToRetry, setUniqueIdToRetry] = useState<string | null>(null);
  const [modelValue, setModelValue] = useState<ModelValueType>("gpt");
  const [isLoading, setIsLoading] = useState(false);
  let loadInterval: number | undefined;

  const generateUniqueId = () => {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);

    return `id-${timestamp}-${hexadecimalString}`;
  };

  const htmlToText = (html: string) => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent;
  };

  const delay = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const addLoader = (uid: string) => {
    const element = document.getElementById(uid) as HTMLElement;
    element.textContent = "";

    // @ts-ignore
    loadInterval = setInterval(() => {
      // Update the text content of the loading indicator
      element.textContent += ".";

      // If the loading indicator has reached three dots, reset it
      if (element.textContent === "....") {
        element.textContent = "";
      }
    }, 300);
  };

  const addResponse = (selfFlag: boolean, response?: string) => {
    const uid = generateUniqueId();
    setResponseList((prevResponses) => [
      ...prevResponses,
      {
        id: uid,
        response,
        selfFlag,
      },
    ]);
    return uid;
  };

  const updateResponse = (
    uid: string,
    updatedObject: Record<string, unknown>
  ) => {
    setResponseList((prevResponses) => {
      const updatedList = [...prevResponses];
      const index = prevResponses.findIndex((response) => response.id === uid);
      if (index > -1) {
        updatedList[index] = {
          ...updatedList[index],
          ...updatedObject,
        };
      }
      return updatedList;
    });
  };

  const regenerateResponse = async () => {
    await getGPTResult(promptToRetry, uniqueIdToRetry);
  };

  const getGPTResult = async (
    _promptToRetry?: string | null,
    _uniqueIdToRetry?: string | null
  ) => {
    // Get the prompt input
    const _prompt = _promptToRetry ?? htmlToText(prompt);

    // If a response is already being generated or the prompt is empty, return
    if (isLoading || !_prompt) {
      return;
    }

    setIsLoading(true);

    // Clear the prompt input
    setPrompt("");

    let uniqueId: string;
    if (_uniqueIdToRetry) {
      uniqueId = _uniqueIdToRetry;
    } else {
      // Add the self prompt to the response list
      addResponse(true, _prompt);
      uniqueId = addResponse(false);
      await delay(50);
      addLoader(uniqueId);
    }

    try {
      // Send a POST request to the API with the prompt in the request body
      const response = await axios.post("get-prompt-result", {
        prompt: _prompt,
        model: modelValue,
      });
      if (modelValue === "image") {
        // Show image for `Create image` model
        updateResponse(uniqueId, {
          image: response.data,
        });
      } else {
        updateResponse(uniqueId, {
          response: response.data.trim(),
        });
      }

      setPromptToRetry(null);
      setUniqueIdToRetry(null);
    } catch (err) {
      setPromptToRetry(_prompt);
      setUniqueIdToRetry(uniqueId);
      updateResponse(uniqueId, {
        // @ts-ignore
        response: `Error: ${err.message}`,
        error: true,
      });
    } finally {
      // Clear the loader interval
      clearInterval(loadInterval);
      setIsLoading(false);
    }
  };

  return (
    <Container fluid className="App d-flex flex-column justify-content-between">
      <Row className="header-logo-container">
        <div className="d-flex gap-1 justify-content-center align-items-center">
          <img src={Logo} className="header-logo"></img>
          <p className="logo-text fs-2 m-0">Lystloc</p>
        </div>
      </Row>
      <Row className="response-container-row">
        <Col className="response-container p-0">
          <div className="">
            <div className="response-list">
              <PromptResponseList
                responseList={responseList}
                key="response-list"
              />
            </div>
          </div>
        </Col>
      </Row>

      {uniqueIdToRetry && (
        <Row>
          <Col>
            <div className="regenerate-button-container">
              <Button
                id="regenerate-response-button"
                className={isLoading ? "loading" : ""}
                onClick={() => regenerateResponse()}
              >
                Regenerate Response
              </Button>
            </div>
          </Col>
        </Row>
      )}

      <Row className="bottom-container-row  d-flex flex-column p-0 m-0">
        <Col className="bottom-container-data">
          <Form className="d-flex justify-content-center align-items-center ">
            <Form.Group
              controlId="model-select"
              className="form pt-2 d-flex flex-column justify-content-center align-items-center"
            >
              <Form.Control
                className="w-75"
                size="sm"
                as="select"
                value={modelValue}
                onChange={(event) =>
                  setModelValue(event.target.value as ModelValueType)
                }
              >
                <option value="gpt">GPT-3</option>
                <option value="codex">Codex</option>
                <option value="image">Create Image</option>
              </Form.Control>
            </Form.Group>
          </Form>
        </Col>

        <Col>
          <div className="input-container gap-2 w-100">
            <PromptInput
              prompt={prompt}
              onSubmit={() => getGPTResult()}
              key="prompt-input"
              updatePrompt={(prompt) => setPrompt(prompt)}
            />
            <Button
              id="submit-button"
              className={isLoading ? "loading" : ""}
              onClick={() => getGPTResult()}
            ></Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default App;
