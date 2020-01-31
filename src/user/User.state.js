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

/**
 *  renku-ui
 *
 *  User.state.js
 *  User controller code.
 */

import { API_ERRORS } from '../api-client/errors';

class UserCoordinator {
  constructor(client, model) {
    this.client = client;
    this.model = model;
  }

  fetchUser() {
    this.model.set("fetching", true);

    return this.client.getUser()
      .catch(error => {
        // we get 401 unauthorized when the user is not logged in
        if (error.case !== API_ERRORS.unauthorizedError)
          throw error;
        return {};
      })
      .then(data => {
        // overwrite user data and set if it's logged or not
        this.model.setObject({
          fetching: false,
          fetched: new Date(),
          logged: data && data.username && data.state === "active" ? true : false,
          data: { $set: data }
        });

        return data;
      })
  }
}

export { UserCoordinator };
