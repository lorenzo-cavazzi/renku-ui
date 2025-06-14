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

describe("display the home page", () => {
  beforeEach(() => {
    fixtures.config().versions().userNone();
    cy.visit("/");
  });

  it("displays the home page intro text", () => {
    cy.get("h1").should("have.length", 1);
    cy.get("h1")
      .first()
      .should("have.text", "Connecting data, code, compute, and people.");
  });
});

describe("404 page", () => {
  beforeEach(() => {
    fixtures.config().versions().userNone();
    cy.visit("/xzy");
  });

  it("show error page", () => {
    cy.get("h3").should("contain.text", "Page not found");
  });
});

describe("display the home page even when APIs return strange responses", () => {
  beforeEach(() => {
    fixtures.config().versions().statuspageDown().userNone();
    cy.visit("/");
  });

  it("displays the home page intro text", () => {
    cy.wait("@getUser");
    cy.get("h1").should("have.length", 1);
    cy.get("h1")
      .first()
      .should("have.text", "Connecting data, code, compute, and people.");
  });
});

describe("display version information", () => {
  beforeEach(() => {
    fixtures.config().versions().userNone();
    cy.visit("/v1");
  });

  it("shows release and component versions", () => {
    cy.getDataCy("version-info").should("be.visible").click();
    cy.contains("Renku version 3.10.0").should("be.visible");
    cy.contains("UI: 3.10.0").should("be.visible");
    cy.contains("Core: v2.4.1").should("be.visible");
    cy.contains("Notebooks: 1.22.0").should("be.visible");
  });
});

describe("shows terms of use", () => {
  beforeEach(() => {
    fixtures.versions().userNone();
  });

  it("Default terms are visible visible", () => {
    fixtures.config();
    cy.visit("/v1/help/tos");
    cy.contains("No terms of use have been configured.").should("be.visible");
    cy.get("a").contains("Terms of Use").should("not.exist");
  });

  it("Terms of use are visible", () => {
    fixtures
      .config({ overrides: { TERMS_PAGES_ENABLED: true } })
      .overrideTermsOfUse();
    cy.visit("/v1/help/tos");
    cy.wait("@getOverrideTermsOfUse");
    cy.get("h1").contains("Override terms of use").should("be.visible");
    cy.get("a").contains("Terms of Use").should("exist").should("be.visible");
  });
});

describe("shows privacy policy", () => {
  beforeEach(() => {
    fixtures.versions().userNone();
  });

  it("Default privacy policy is visible", () => {
    fixtures.config();
    cy.visit("/v1/help/privacy");
    cy.contains("No privacy policy has been configured.").should("be.visible");
    cy.get("a").contains("Privacy Policy").should("not.exist");
  });

  it("Privacy policy is visible", () => {
    fixtures
      .config({ overrides: { TERMS_PAGES_ENABLED: true } })
      .overridePrivacyPolicy();
    cy.visit("/v1/help/privacy");
    cy.wait("@getOverridePrivacyPolicy");
    cy.get("h1").contains("Override privacy policy").should("be.visible");
    cy.get("a").contains("Privacy Policy").should("exist").should("be.visible");
  });
});
