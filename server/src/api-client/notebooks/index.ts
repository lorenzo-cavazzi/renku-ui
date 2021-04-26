/*!
 * Copyright 2021 - Swiss Data Science Center (SDSC)
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

// // import { ApiClient } from "../";

// // function addNotebooksApi(client: ApiClient): void {

// //   client.getNotebookServers = (namespace, project, branch, commit, anonymous = false) => {
// //     const headers = client.getBasicHeaders();
// //     const url = `${client.baseUrl}/notebooks/servers`;
// //     let parameters = {};
// //     if (namespace) parameters.namespace = decodeURIComponent(namespace);
// //     if (project) parameters.project = project;
// //     if (branch) parameters.branch = branch;
// //     if (commit) parameters.commit_sha = commit;

// //     return client.clientFetch(
// //       url,
// //       { method: "GET", headers, queryParams: parameters },
// //       FETCH_DEFAULT.returnType,
// //       FETCH_DEFAULT.alertOnErr,
// //       FETCH_DEFAULT.reLogin,
// //       anonymous
// //     ).then(resp => {
// //       return { "data": resp.data.servers };
// //     });
// //   };
// // }

// // export { addNotebooksApi };

// try {
  //   const url = `${process.env.GATEWAY_URL}/notebooks/servers`;
  //   // TODO: use got? https://www.npmjs.com/package/got
  //   // ? check HERE for reference, but fetch may be good enough
  //   // ? https://nodesource.com/blog/express-going-into-maintenance-mode
  //   // ! TODO: from here
  //   const serverPromise = fetch(url);
  //   serverPromise.then(servers => {
  //     const hashed = hash(servers);
  //     if (monitor.sessions.previous !== null) {
  //       if (hashed !== monitor.sessions.previous)
  //         socket.send("{sessions: changed}");
  //     }
  //     monitor.sessions.previous = hashed;
  //   });
  // }
  // catch (e) {
  //   logger.info("Error! " + JSON.stringify(e));
  // }
