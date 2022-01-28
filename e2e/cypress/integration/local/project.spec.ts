/// <reference types="cypress" />
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

import Fixtures from "../../support/renkulab-fixtures";

describe("display a project", () => {
  beforeEach(() => {
    const fixtures = new Fixtures(cy);
    fixtures.config().versions().userTest();
    fixtures.projects().landingUserProjects().projectTest();
    cy.visit("/projects/e2e/local-test-project");
  });

  it("displays the project overview page", () => {
    cy.wait("@getReadme");
    // Check that the project header is shown
    cy.get("[data-cy='project-header']").should(
      "contain.text",
      "local-test-project Public"
    );
    // Check that the readme is shown
    cy.get("h1").first().should("contain.text", "local test project");
  });
});