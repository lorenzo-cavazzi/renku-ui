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

describe("display a dataset", () => {
  beforeEach(() => {
    fixtures.config().versions().userTest();
    fixtures.projects().landingUserProjects();
    fixtures.entitySearch().getLastSearch();
    cy.visit("/v1/search?type=dataset");
  });

  it("displays the dataset list", () => {
    cy.wait("@getEntities").then((data) => {
      const totalDatasets = data.response.body.length;
      // all datasets are displayed
      cy.getDataCy("list-card").should("have.length", totalDatasets);
    });
  });

  it("displays the dataset overview", () => {
    cy.wait("@getEntities");
    const datasetName = "abcd";
    const datasetIdentifier = "4577b68957b7478bba1f07d6513b43d2";

    fixtures.datasetById({ id: datasetIdentifier });
    cy.getDataCy("list-card-title").contains(datasetName).click();
    cy.wait("@getDatasetById")
      .its("response.body")
      .then((dataset) => {
        // Check that the title is correct
        cy.get("title")
          .first()
          .should(
            "contain.text",
            "abcd • Dataset • Dataset for testing purposes"
          );
        // the dataset title is displayed
        cy.getDataCy("dataset-title").should("contain.text", dataset?.name);
        // files are displayed
        const totalFiles = dataset?.hasPart?.length;
        cy.getDataCy("dataset-file-title").should(
          "contain.text",
          `Dataset files (${totalFiles})`
        );
        cy.getDataCy("dataset-fs-element").should("have.length", 2);

        // projects that use the dataset are displayed
        const totalProjectsUsingDataset = dataset?.usedIn?.length || 0;
        if (totalProjectsUsingDataset > 1)
          cy.getDataCy("project-using-dataset").should(
            "have.length",
            totalProjectsUsingDataset
          );
      });
  });

  it("displays warning when dataset is invalid", () => {
    const invalidDatasetId = "99a46c10c94a40359181965e5c4cdabc";
    fixtures.invalidDataset({ id: invalidDatasetId });
    cy.visit(`/datasets/${invalidDatasetId}`);
    cy.wait("@invalidDataset");
    cy.get("h3").should("contain.text", "Dataset not found");
  });
});
