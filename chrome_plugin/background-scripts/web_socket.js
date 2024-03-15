let webSocket = null;
let sessionId, session_status;

function connectToWebSocket() {
  webSocket = new WebSocket("ws://localhost:3008");

  webSocket.onopen = () => {
    console.log("WebSocket connected");
    changeIcon("../icons/server_up.png");
  };

  webSocket.onerror = (err) => {
    console.error("WebSocket error:", err);
    changeIcon("../icons/server_down.png");
  };

  webSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("Message from server: ", JSON.parse(event.data), data.type);
    if (data.type === "sessionStarted") {
      session_status = true;
    } else if (data.type === "sessionStopped") {
      session_status = false;
    }

    sessionId = data.sessionId;
  };
}

// Initial connection attempt
connectToWebSocket();

// Reconnect every 5 seconds if not connected
setInterval(() => {
  if (webSocket === null || webSocket.readyState !== WebSocket.OPEN) {
    connectToWebSocket();
  }
}, 5000);

// Message listener from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (webSocket && webSocket.readyState === WebSocket.OPEN) {
    message.sessionId = sessionId;

    if (!sessionId && !session_status) return;
    console.log({ payload: message });
    webSocket.send(JSON.stringify(message));
  } else {
    console.log("WebSocket not ready, data ignored");
  }
});

function changeIcon(imageIcon) {
  chrome.action.setIcon({ path: imageIcon });
}
