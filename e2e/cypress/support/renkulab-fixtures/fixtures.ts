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

/**
 * Common fixtures defined in one place.
 */

class Fixtures {
  readonly cy: Cypress.Chainable;

  constructor(cy) {
    this.cy = cy;
  }

  config(name = "getConfig") {
    cy.intercept("/config.json", {
      fixture: "config.json"
    }).as(name);
    return this;
  }

  versions(name = "getVersion") {
    cy.intercept("/ui-server/api/versions", {
      fixture: "version.json"
    }).as(name);
    return this;
  }
}

export default Fixtures;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FixturesConstructor = new (...args: any[]) => Fixtures;