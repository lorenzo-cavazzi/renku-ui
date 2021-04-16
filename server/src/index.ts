/*!
 * Copyright 2020 - Swiss Data Science Center (SDSC)
 * A partnership between École Polytechnique Fédérale de Lausanne (EPFL) and
 * Eidgenössische Technische Hochschule Zürich (ETHZ).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import express from "express";
import logger from "./logger";
import routes from "./routes";
import morgan from "morgan";
//import WebSocket from "ws";
//var expressWs = require('express-ws')(app);
// import expressWs from "express-ws";
import ws from "ws";

const app = express();
//const appWs = expressWs(app);
const port = 8080; // default port to listen
//appWs.getWss().

// configure logging
const logStream = {
  write: (message: string) => {
    logger.info(message);
  },
};
app.use(morgan("combined", { stream: logStream }));


routes.register(app);

// start the Express server
const server = app.listen(port, () => {
  logger.info(`server started at http://localhost:${port}`);
});

// start the WebSocket server
// ? https://github.com/websockets/ws
// TODO: scroll down to read more about paths and client authentication
// const wsServer = new ws.Server({ noServer: true });
const wsServer = new ws.Server({ server });
// logger.info(JSON.stringify(wsServer))

// handle upgrade of the request
// ? REF: https://dev.to/ksankar/websockets-with-react-express-part-1-4o68
// wsServer.on("upgrade", function upgrade(request, socket, head) {
//   try {
//     // authentication and some other steps will come here
//     // we can choose whether to upgrade or not

//     wsServer.handleUpgrade(request, socket, head, function done(ws) {
//       wsServer.emit("connection", ws, request);
//     });
//   } catch (err) {
//     console.log("upgrade exception", err);
//     socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
//     socket.destroy();
//     return;
//   }
// });

// ? REF: https://masteringjs.io/tutorials/express/websockets
// ? REF: https://stackoverflow.com/questions/63099518/sending-a-websocket-message-from-a-post-request-handler-in-express
wsServer.on("connection", socket => {
  logger.info("enstablished connection");
  socket.send("Connection enstablished");
  socket.on("message", message => logger.info(`WebSocket: ${message}`));
});

// ? test with: webSocket = new WebSocket("wss://lorenzo.dev.renku.ch/ui-server", "abc")

process.on("SIGTERM", () => {
  server.close(() => {
    logger.info("Shutting down.");
  });
});

process.on("SIGINT", () => {
  server.close(() => {
    logger.info("Interrupted, shutting down.");
  });
});
