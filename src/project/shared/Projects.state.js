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
 *  Projects.state.js
 *  Projects controller code.
 */

// import { API_ERRORS } from '../api-client/errors';

class ProjectsCoordinator {
  constructor(client, model) {
    this.client = client;
    this.model = model; // considering the global model, pass `model.subModel("projects")`
  }

  _starredProjectMetadata(project) {
    return {
      id: project.id,
      path_with_namespace: project.path_with_namespace,
      description: project.description,
      tag_list: project.tag_list,
      star_count: project.star_count,
      owner: project.owner,
      last_activity_at: project.last_activity_at
    }
  }

  async getFeatured(tryPreserve = false) {
    // set status to fetching and invoke both APIs
    this.model.set("fetching", true);
    const promiseStarred = this.client.getProjects({ starred: true, order_by: "last_activity_at" })
      .then((projectResponse) => {
        // TODO: logic is lame, review this IF NEEDED
        // ! the real cost is in the fetch, not the new .set()
        // if (tryPreserve) {
        //   const oldStarred = this.model.get("featured.starred");
        //   if (!oldStarred || !oldStarred.length )
        //     return;
          
        // }
        const projects = projectResponse.data.map((project) => this._starredProjectMetadata(project));
        return projects;
      })
      .catch((error) => {
        this.model.set("starredProjects", []);
      });
    const promiseMember = this.client.getProjects({ membership: true, order_by: "last_activity_at" })
      .then((projectResponse) => {
        const projects = projectResponse.data.map((project) => this._starredProjectMetadata(project));
        return projects;
      })
      .catch((error) => {
        this.model.set("memberProjects", []);
      });

    // set `featured` content and return only `starred` and `member` projects data
    return Promise.all([promiseStarred, promiseMember]).then(values => {
      this.model.setObject({
        featured: {
          starred: { $set: values[0] },
          member: { $set: values[1] },
          fetched: new Date(),
          fetching: false
        }
      });

      return { starred: values[0], member: values[1] };
    });
  }

  updateStarred(project, isStarred) {
    const starred = this.model.get("featured.starred");
    let newStarred;
    if (isStarred) {
      newStarred = [...starred, this._starredProjectMetadata(project)];
    }
    else {
      const indexToRemove = starred.map(project => project.id).indexOf(project.id);
      newStarred = [
        ...starred.slice(0, indexToRemove),
        ...starred.slice(indexToRemove + 1)
      ];
    }
    this.model.set("featured.starred", newStarred);
    console.log("updateStarred: ", this.model.get("featured.starred"))
    return newStarred;
  }

  // ! REMOVE -- EXAMPLES
  // fetchUser() {
  //   console.log("fetchUser")
  //   this.model.set("fetching", true);

  //   return this.client.getUser()
  //     .catch(error => {
  //       // we get 401 unauthorized when the user is not logged in
  //       if (error.case !== API_ERRORS.unauthorizedError)
  //         throw error;
  //       return { data: {} } 
  //     })
  //     .then(response => { 
  //       // overwrite user data and extract
  //       const { data } = response; 
  //       this.model.setObject({
  //         fetching: false,
  //         fetched: new Date(),
  //         logged: data && data.username && data.state === "active" ? true : false,
  //         data: { $set: data } 
  //       });

  //       return response.data; 
  //     })
  // }

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

export { ProjectsCoordinator }
