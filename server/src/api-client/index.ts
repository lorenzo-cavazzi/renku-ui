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

import winston from "winston";
import http from "http";
import ws from "ws";
import hash from "object-hash";
import fetch, { RequestInit } from "node-fetch";
import axios from "axios";
import { METHODS } from "node:http";
// import logger from "src/logger";
// import logger from "../logger";


const RETURN_TYPES = {
  json: "json",
  text: "text",
  full: "full"
};

const FETCH_DEFAULT = {
  queryParams: {},
  options: {
    "method": "get"
  },
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Credentials": "same-origin",
    "X-Requested-With": "XMLHttpRequest"
  },
  returnType: RETURN_TYPES.json,
  reLogin: true,
};

interface ApiClient {
  logger: winston.Logger,
  baseUrl: string,
  gatewayUrl: string,
}

class ApiClient {
  constructor(logger: winston.Logger, baseUrl: string, gatewayUrl: string) {
    this.logger = logger;
    this.baseUrl = baseUrl;
    this.gatewayUrl = gatewayUrl;
  }

  async tryRelogin(): Promise<void> {
    // This is invoked to try to refresh authentication.
    // ? window.location = `${this.baseUrl}/auth/login?redirect_url=${encodeURIComponent(window.location.href)}`;
    const url = `${this.baseUrl}/auth/login?redirect_url=${encodeURIComponent(this.baseUrl)}`;
    const result = await fetch(url);
  }

  async clientFetch(
    url: string,
    headers: Record<string, string>,
    queryParams: Record<string, string> = FETCH_DEFAULT.queryParams,
    options: RequestInit = FETCH_DEFAULT.options,
    returnType: string = FETCH_DEFAULT.returnType,
    reLogin: boolean = FETCH_DEFAULT.reLogin,
  ): Promise<any> {
    // const fetchInit: RequestInit = {
    //   ...options
    // };
    const urlObject = new URL(url);
    for (const param of Object.keys(queryParams))
      urlObject.searchParams.append(param, queryParams[param]);

    const axiosOptions = {
      headers: {
        ...FETCH_DEFAULT.headers,
        ...headers
      }
    };
    //axios(url, axiosOptions).then(resp => {
    axios.get(url, axiosOptions).then(response => {
      //
      this.logger.info(response.status);
    });

    return;
    return fetch(urlObject, {
      ...options,
      headers: {
        ...FETCH_DEFAULT.headers,
        ...headers
      }
    })
      .catch((error) => {
        // For permission errors we try to re-login
        if (reLogin && error.case == 401)
          this.tryRelogin();
        else
          return Promise.reject(error);
      })
      .then((response) => {
        if (!response)
          return null;
        if (returnType === RETURN_TYPES.json) {
          try {
            //
            response.json().then(data => {
              return {
                data,
                pagination: {} //processPaginationHeaders(response.headers)
              };
            });
          }
          catch (e) {
            Promise.reject(e);
          }
        }
        else if (returnType === RETURN_TYPES.text) {
          return response.text();
        }
      });
  }

  // TODO: move this to an extentions. Even better, use the `declare module` on a `d.ts` file.
  async getNotebookServers(cookies: string = null): Promise<Record<string, Record<string, unknown>>> {
    const headers = { "cookie": cookies };
    const url = `${this.gatewayUrl}/notebooks/servers`;
    return this.clientFetch(url, headers).then(resp => {
      return resp.data.servers;
    });

    // let parameters = {};
    // if (namespace) parameters.namespace = decodeURIComponent(namespace);
    // if (project) parameters.project = project;
    // if (branch) parameters.branch = branch;
    // if (commit) parameters.commit_sha = commit;

    // return client.clientFetch(
    //   url,
    //   { method: "GET", headers, queryParams: parameters },
    //   FETCH_DEFAULT.returnType,
    //   FETCH_DEFAULT.alertOnErr,
    //   FETCH_DEFAULT.reLogin,
    //   anonymous
    // ).then(resp => {
    //   return { "data": resp.data.servers };
    // });
  }
}

export { ApiClient };
export default ApiClient;
