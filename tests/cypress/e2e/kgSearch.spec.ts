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

import fixtures from "../support/renkulab-fixtures";

describe("display kg search", () => {
  beforeEach(() => {
    fixtures.config().versions().userTest();
    fixtures.entitySearch().getLastSearch();
    fixtures.projects().landingUserProjects().projectTest();
    fixtures.projectLockStatus().projectMigrationUpToDate();
    cy.visit("/v1/search");
  });

  it("displays the filters", () => {
    cy.wait("@getEntities");
    cy.wait("@getLastSearch");
    cy.contains("Hide Filters").should("be.visible");
    cy.getDataCy("filter-button-hide").click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(100);
    cy.getDataCy("filter-button-show").should("be.visible");
  });
});
