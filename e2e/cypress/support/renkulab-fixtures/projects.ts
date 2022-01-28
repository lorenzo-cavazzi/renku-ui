/*!
 * Copyright 2022 - Swiss Data Science Center (SDSC)
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

import { FixturesConstructor } from "./fixtures";

/**
 * Fixtures for Projects
 */

function Projects<T extends FixturesConstructor>(Parent: T) {
  return class ProjectsFixtures extends Parent {
    landingUserProjects(name = "getLandingUserProjects") {
      cy.intercept("/ui-server/api/graphql", {
        fixture: "landing-user-projects.json"
      }).as(name);
      return this;
    }

    projects(name = "getProjects") {
      cy.intercept(
        "/ui-server/api/projects?query=last_activity_at&per_page=100&starred=true&page=1",
        {
          fixture: "projects.json"
        }
      ).as(name);
      return this;
    }

    projectTest(
      names = {
        projectBranchesName: "projectBranches",
        projectCommitsName: "projectCommits",
        projectName: "getProject",
        projectReadmeCommits: "getProjectReadmeCommits",
        readmeName: "getReadme",
        validationName: "getValidation"
      }
    ) {
      const {
        projectBranchesName,
        projectCommitsName,
        projectName,
        readmeName
      } = names;
      const { projectReadmeCommits, validationName } = names;
      cy.intercept(
        "/ui-server/api/projects/e2e%2Flocal-test-project?statistics=true",
        {
          fixture: "test-project.json"
        }
      ).as(projectName);
      cy.intercept(
        "/ui-server/api/projects/39646/repository/files/README.md/raw?ref=master",
        { fixture: "test-project-readme.md" }
      ).as(readmeName);
      cy.intercept(
        "/ui-server/api/projects/39646/repository/commits?ref_name=master&per_page=2&path=README.md&page=1",
        { fixture: "test-project-readme-commits.json" }
      ).as(projectReadmeCommits);
      cy.intercept(
        "/ui-server/api/projects/39646/repository/commits?ref_name=master&per_page=100&page=1",
        { fixture: "test-project-commits.json" }
      ).as(projectCommitsName);
      cy.intercept(
        "/ui-server/api/projects/39646/repository/branches?per_page=100&page=1",
        { fixture: "test-project-branches.json" }
      ).as(projectBranchesName);
      cy.intercept("/ui-server/api/projects/39646/graph/webhooks/validation", {
        body: { message: "Hook valid" }
      }).as(validationName);
      // TODO make a fixture for the cache.migrations_check request
    }
  };
}

export { Projects };