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
    console.log("fetchUser")
    this.model.set("fetching", true);

    return this.client.getUser()
      .catch(error => {
        // we get 401 unauthorized when the user is not logged in
        if (error.case !== API_ERRORS.unauthorizedError)
          throw error;
        return { data: {} }  // TODO: move to just `data` by changing this.client.getUser
      })
      .then(response => { // TODO: move to just `data` by changing this.client.getUser
        // overwrite user data and extract
        const { data } = response; // TODO: move to just `data` by changing this.client.getUser
        this.model.setObject({
          fetching: false,
          fetched: new Date(),
          logged: data && data.username && data.state === "active" ? true : false,
          data: { $set: data }  // TODO: move to just `data` by changing this.client.getUser
        });

        // ! TODO: user.memberProjects and user.starredProjects were moved
        // ! Do I still need to invoke their update here? probably not...
        // this.TEMP_fetchUserProjects();
        return response.data; // TODO: move to just `data` by changing this.client.getUser
      })
  }

  // TEMP_starredProjectMetadata(project) {
  //   return {
  //     id: project.id,
  //     path_with_namespace: project.path_with_namespace,
  //     description: project.description,
  //     tag_list: project.tag_list,
  //     star_count: project.star_count,
  //     owner: project.owner,
  //     last_activity_at: project.last_activity_at
  //   }
  // }

  // TEMP_fetchUserProjects() {
  //   this.client.getProjects({ starred: true, order_by: 'last_activity_at' })
  //     .then((projectResponse) => {
  //       const projects = projectResponse.data.map((project) => this.TEMP_starredProjectMetadata(project));
  //       this.model.set('starredProjects', projects);
  //     })
  //     .catch((error) => {
  //       this.model.set('starredProjects', []);
  //     });
  //   this.client.getProjects({ membership: true, order_by: 'last_activity_at' })
  //     .then((projectResponse) => {
  //       const projects = projectResponse.data.map((project) => this.TEMP_starredProjectMetadata(project));
  //       this.model.set('memberProjects', projects);
  //     })
  //     .catch((error) => {
  //       this.model.set('memberProjects', []);
  //     });
  // }

  // ! REMOVE -- EXAMPLE FROM NOTEBOOKS
  // async fetchCommits() {
  //   this.model.set('data.fetching', true);
  //   const filters = this.model.get('filters');
  //   const projectPathWithNamespace = `${encodeURIComponent(filters.namespace)}%2F${filters.project}`;
  //   return this.client.getCommits(projectPathWithNamespace, filters.branch.name)
  //     .then(resp => {
  //       this.model.setObject({
  //         data: {
  //           fetching: false,
  //           fetched: new Date(),
  //           commits: { $set: resp.data }
  //         }
  //       })
  //       return resp.data;
  //     })
  //     .catch(error => {
  //       this.model.set('data.fetching', false);
  //       throw error;
  //     });
  // }
}

export { UserCoordinator }
