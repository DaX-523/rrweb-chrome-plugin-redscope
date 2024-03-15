import { WebSocketServer } from "ws";
import fs from "fs-extra";
import { dataFolderName } from "./constants.js";
import path from "path";
const sessionIds = [0];
const startWebSocketServer = () => {
  const wss = new WebSocketServer({ port: 3008 });
  wss.on("connection", (ws) => {
    console.log("WebSocket connection established.");

    // Handle incoming messages
    ws.on("message", (message) => {
      console.log("msgbru", message);
      const payload = JSON.parse(message.toString());
      if (payload.type !== "rrweb events") {
        console.log("sid");
        if (payload.type === "session Id Change" && payload.session_status) {
          let sessionId = sessionIds[sessionIds.length - 1];
          payload.sessionId = ++sessionId;
          sessionIds.push(sessionId);
        } else {
          payload.sessionId = null;
        }
        wss.clients.forEach((client) =>
          client.send(
            JSON.stringify({
              type: payload.session_status
                ? "sessionStarted"
                : "sessionStopped",
              sessionId: payload.sessionId,
            })
          )
        );
        // ws.send(
        //   JSON.stringify({
        //     type: payload.session_status ? "sessionStarted" : "sessionStopped",
        //     sessionId: payload.sessionId,
        //   })
        // );
      }
      processPayload(payload);
    });
  });
};

let lastUrl = null;
let id = 0;
const processPayload = (payload) => {
  const { type, url, data } = payload;
  console.log("*".repeat(80));
  console.log({ type, url, payload });
  console.log("*".repeat(80));

  if (type !== "rrweb events") {
    return;
  }
  const jsonData = JSON.parse(data);
  console.log("id", id);
  let dataFilePath;
  if (url === lastUrl) {
    // Simply append to the same file;  No change
    dataFilePath = path.join(dataFolderName, id.toString());
    fs.writeJsonSync(dataFilePath, jsonData, { flag: "a" });
  } else {
    id++;
    dataFilePath = path.join(dataFolderName, id.toString());
    fs.writeJsonSync(dataFilePath, jsonData); // This would empty the files if there's already content
  }
  lastUrl = url;
};

export { startWebSocketServer };
