/*!
 * Copyright 2023 - Swiss Data Science Center (SDSC)
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
import {
  DISMISSIBLE_SIMPLE_INFO_MESSAGE_FIXTURE,
  NON_DISMISSIBLE_READ_MORE_SUCCESS_MESSAGE_FIXTURE,
} from "../support/renkulab-fixtures/dashboard";

const findProject = (path, projects) => {
  return projects.find(
    (result) => result.response.body.path_with_namespace === path
  );
};

describe("dashboard", () => {
  beforeEach(() => {
    fixtures.config().versions().userTest().userPreferences();
  });

  it("user does has not own projects and no projects recently visited", () => {
    fixtures
      .projects()
      .entitySearch({ fixture: "kgSearch/emptySearch.json", total: 0 })
      .getLastVisitedProjects({
        fixture: "projects/empty-last-visited-projects.json",
      })
      .noActiveProjects()
      .sessionServersEmpty();

    cy.visit("/v1");
    cy.wait("@getUser");
    cy.wait("@getDataServiceUser");
    cy.wait("@getEntities");
    cy.wait("@getLastVisitedProjects");
    cy.wait("@getNoActiveProjects");

    cy.getDataCy("dashboard-title").should(
      "have.text",
      "Renku Dashboard - E2E User"
    );
    cy.getDataCy("project-alert").should(
      "contain.text",
      "You do not have any projects yet"
    );
    cy.getDataCy("projects-container").should(
      "contain.text",
      "You do not have any recently-visited projects"
    );
    cy.getDataCy("explore-other-projects-btn").should("be.visible");
    cy.getDataCy("inactive-kg-project-alert").should("exist");
  });

  it("user does not have own project but has visited projects", () => {
    fixtures
      .projects()
      .sessionServersEmpty()
      .entitySearch({ fixture: "kgSearch/emptySearch.json", total: 0 })
      .getLastVisitedProjects();
    const files = {
      "lorenzo.cavazzi.tech/readme-file-dev": 30929,
      "e2e/nuevo-projecto": 44966,
      "e2e/testing-datasets": 43781,
      "e2e/local-test-project": 39646,
    };
    // fixture landing page project data
    for (const filesKey in files) {
      fixtures.project({
        fixture: `projects/project_${files[filesKey]}.json`,
        name: `projectLanding-${filesKey}`,
        projectPath: filesKey,
        statistics: false,
      });
    }

    cy.visit("/v1");
    let projects;
    cy.wait("@getUser");
    cy.wait("@getDataServiceUser");
    cy.wait("@getLastVisitedProjects").then(
      (result) => (projects = result.response.body.projects)
    );
    cy.wait(
      Object.keys(files).map((filesKey) => `@projectLanding-${filesKey}`)
    ).then((results) => {
      const firstProject = findProject(projects[0], results);
      const projectData = firstProject.response?.body;
      cy.getDataCy("projects-container")
        .find('[data-cy="list-card-title"]')
        .first()
        .should("have.text", projectData.name);
      cy.getDataCy("explore-other-projects-btn").should("be.visible");
      cy.getDataCy("project-alert").should(
        "contain.text",
        "You do not have any projects yet"
      );
      cy.getDataCy("inactive-kg-project-alert").should("not.exist");
    });
  });

  it("user has own projects and recently visited projects", () => {
    fixtures
      .projects()
      .sessionServersEmpty()
      .entitySearch()
      .getLastVisitedProjects({
        fixture: "projects/last-visited-projects-5.json",
      });
    const files = {
      "lorenzo.cavazzi.tech/readme-file-dev": 30929,
      "e2e/testing-datasets": 43781,
      "e2e/local-test-project": 39646,
      "e2e/nuevo-project": 44966,
      "e2e/local-test-project-2": 44967,
    };
    // fixture landing page project data
    for (const filesKey in files) {
      fixtures.project({
        fixture: `projects/project_${files[filesKey]}.json`,
        name: `getProject-${filesKey}`,
        projectPath: filesKey,
        statistics: false,
      });
    }

    cy.visit("/v1");
    let projects;
    cy.wait("@getUser");
    cy.wait("@getDataServiceUser");
    cy.wait("@getLastVisitedProjects").then(
      (result) => (projects = result.response.body.projects)
    );
    cy.wait(
      Object.keys(files).map((filesKey) => `@getProject-${filesKey}`)
    ).then((results) => {
      const firstProject = findProject(projects[0], results);
      const projectData = firstProject.response?.body;
      cy.getDataCy("projects-container")
        .find('[data-cy="list-card-title"]')
        .first()
        .should("have.text", projectData.name);
      cy.getDataCy("project-alert").should("not.exist");
      cy.getDataCy("explore-other-projects-btn").should("not.exist");
      cy.getDataCy("view-my-projects-btn").should("be.visible");
    });
  });

  it("user has sessions to display in dashboard", () => {
    fixtures
      .projects()
      .entitySearch()
      .getLastVisitedProjects({
        fixture: "projects/last-visited-projects-5.json",
      })
      .getSessions({ fixture: "sessions/sessionsWithError.json" })
      .getProjectCommits();
    const files = {
      "dalatinrofrau/flights-usa": 55402,
      "dalatinrofrau/corrupted-project-session-error": 78277,
      "lorenzo.cavazzi.tech/readme-file-dev": 30929,
      "e2e/testing-datasets": 43781,
      "e2e/local-test-project": 39646,
      "e2e/nuevo-project": 44966,
      "e2e/local-test-project-2": 44967,
    };
    // fixture landing page project data
    for (const filesKey in files) {
      fixtures.project({
        fixture: `projects/project_${files[filesKey]}.json`,
        projectPath: filesKey,
        statistics: false,
      });
    }

    fixtures
      .project({
        fixture: "projects/project_30929.json",
        name: "getFirstProject",
        projectPath: "lorenzo.cavazzi.tech/readme-file-dev",
      })
      .projectLockStatus()
      .projectMigrationUpToDate({
        queryUrl:
          "git_url=https%3A%2F%2Fdev.renku.ch%2Fgitlab%2Florenzo.cavazzi.tech%2Freadme-file-dev&branch=master",
      });
    cy.visit("/projects/lorenzo.cavazzi.tech/readme-file-dev/sessions");
    cy.wait("@getFirstProject");

    cy.wait("@getUser");
    cy.wait("@getDataServiceUser");
    cy.wait("@getSessions");
    cy.getDataCy("session-container").should("be.visible");
    cy.visit("/v1");
    cy.wait("@getLastVisitedProjects");
    cy.getDataCy("container-session").should("have.length", 3);
    cy.getDataCy("container-session")
      .first()
      .find(".session-time")
      .should("contain.text", "Error");
    cy.getDataCy("container-session")
      .first()
      .find(".session-icon")
      .should("have.text", "Error");
    cy.getDataCy("container-session")
      .first()
      .find(".entity-action")
      .find("button")
      .first()
      .contains("Loading")
      .should("not.exist");
    cy.getDataCy("container-session")
      .first()
      .find(".entity-action")
      .find("button")
      .first()
      .should("contain.text", "Pause");
  });
});

describe("dashboard message", () => {
  beforeEach(() => {
    fixtures
      .versions()
      .userTest()
      .projects()
      .entitySearch({ fixture: "kgSearch/emptySearch.json", total: 0 })
      .getLastVisitedProjects({
        fixture: "projects/empty-last-visited-projects.json",
      })
      .noActiveProjects()
      .sessionServersEmpty()
      .userPreferences();
  });

  const visitDashboardPage = () => {
    cy.visit("/v1");
    cy.wait("@getUser");
    cy.wait("@getDataServiceUser");
    cy.wait("@getEntities");
    cy.wait("@getLastVisitedProjects");
    cy.wait("@getNoActiveProjects");
  };

  it("does not display a message when disabled", () => {
    fixtures.config();
    visitDashboardPage();

    cy.getDataCy("dashboard-message").should("not.exist");
  });

  it("displays a dissmissible simple info message", () => {
    fixtures.configWithDashboardMessage({
      fixture: DISMISSIBLE_SIMPLE_INFO_MESSAGE_FIXTURE,
    });
    visitDashboardPage();

    cy.getDataCy("dashboard-message")
      .should("be.visible")
      .and("have.class", "alert")
      .and("have.class", "alert-info")
      .and("have.class", "alert-dismissible")
      .and("include.text", "Welcome to Renku!")
      .and("include.text", "This is an example welcome message");

    cy.getDataCy("dashboard-message")
      .should("be.visible")
      .and("have.class", "alert-info");

    cy.getDataCy("dashboard-message")
      .find("button.btn-close")
      .should("be.visible")
      .click();

    // The message is removed on dismissal
    cy.getDataCy("dashboard-message").should("not.exist");

    // The message stays removed after dismissal
    cy.get("#link-search").click();
    cy.get("#link-dashboard").click();
    cy.getDataCy("dashboard-message").should("not.exist");
  });

  it("displays a non-dismissible success message with a read more section", () => {
    fixtures.configWithDashboardMessage({
      fixture: NON_DISMISSIBLE_READ_MORE_SUCCESS_MESSAGE_FIXTURE,
    });
    visitDashboardPage();

    cy.getDataCy("dashboard-message")
      .should("be.visible")
      .and("have.class", "alert")
      .and("have.class", "alert-success")
      .and("not.have.class", "alert-dismissible")
      .and("include.text", "Welcome to Renku!")
      .and("include.text", "This is an example welcome message");

    cy.getDataCy("dashboard-message")
      .should("be.visible")
      .and("have.class", "alert-success");

    cy.getDataCy("dashboard-message")
      .find("button.btn-close")
      .should("not.exist");

    // Expand and collapse the "Read more" section
    cy.getDataCy("dashboard-message")
      .find("a")
      .contains("Read more")
      .should("be.visible")
      .click();
    cy.getDataCy("dashboard-message")
      .contains("This is some more text")
      .should("exist")
      .and("be.visible");
    cy.getDataCy("dashboard-message")
      .find("a")
      .contains("Read more")
      .should("be.visible")
      .click();
    cy.getDataCy("dashboard-message")
      .contains("This is some more text")
      .should("exist")
      .and("not.be.visible");

    // The message stays visible
    cy.get("#link-search").click();
    cy.get("#link-dashboard").click();
    cy.getDataCy("dashboard-message").should("be.visible");
  });
});

describe("Dashboard pins", () => {
  beforeEach(() => {
    fixtures.config().versions().userTest().projects().noActiveProjects();
  });

  it("shows no pinned project by default", () => {
    fixtures
      .entitySearch({ fixture: "kgSearch/emptySearch.json", total: 0 })
      .getLastVisitedProjects({
        fixture: "projects/empty-last-visited-projects.json",
      })
      .sessionServersEmpty()
      .userPreferences();
    cy.visit("/v1");
    cy.wait("@getUserPreferences");

    cy.getDataCy("projects-container").should("be.visible");
    cy.getDataCy("projects-container").find(".bouncer").should("not.exist");
    cy.contains("Pinned projects").should("not.exist");
  });

  it("let the user pin a project", () => {
    fixtures
      .entitySearch()
      .getLastVisitedProjects({
        fixture: "projects/last-visited-projects-5.json",
      })
      .sessionServersEmpty()
      .userPreferences()
      .postPinnedProject();
    const files = {
      "lorenzo.cavazzi.tech/readme-file-dev": 30929,
      "e2e/testing-datasets": 43781,
      "e2e/local-test-project": 39646,
      "e2e/nuevo-project": 44966,
      "e2e/local-test-project-2": 44967,
    };
    // fixture landing page project data
    for (const filesKey in files) {
      fixtures.project({
        fixture: `projects/project_${files[filesKey]}.json`,
        name: `getProject-${filesKey}`,
        projectPath: filesKey,
        statistics: false,
      });
    }

    cy.visit("/v1");
    cy.wait("@getUserPreferences");
    cy.wait(Object.keys(files).map((filesKey) => `@getProject-${filesKey}`));

    cy.getDataCy("projects-container").should("be.visible");
    cy.getDataCy("projects-container").find(".bouncer").should("not.exist");
    cy.contains("Recently visited projects").should("be.visible");
    cy.contains("Pinned projects").should("not.exist");

    fixtures.userPreferences({
      fixture: "user-preferences/user-preferences-1-pin.json",
      name: "getUserPreferencesNew",
    });

    cy.contains(".container-entity-listBar", "e2e/nuevo-project")
      .should("be.visible")
      .as("pickedProject");
    cy.get("@pickedProject")
      .find("[data-cy=pin-badge]")
      .should("be.visible")
      .contains("Pin project to the dashboard")
      .parent()
      .click();

    cy.wait("@getUserPreferencesNew");
    cy.contains("Pinned projects").should("be.visible");
    cy.contains(".container-entity-listBar", "e2e/nuevo-project")
      .should("be.visible")
      .as("pickedProjectPinned");
    cy.get("@pickedProjectPinned")
      .find("[data-cy=pin-badge]")
      .should("be.visible")
      .contains("Unpin project from the dashboard");
  });

  it("let the user unpin a project", () => {
    fixtures
      .entitySearch()
      .getLastVisitedProjects({
        fixture: "projects/last-visited-projects-5.json",
      })
      .sessionServersEmpty()
      .userPreferences({
        fixture: "user-preferences/user-preferences-1-pin.json",
      })
      .deletePinnedProject();
    const files = {
      "lorenzo.cavazzi.tech/readme-file-dev": 30929,
      "e2e/testing-datasets": 43781,
      "e2e/local-test-project": 39646,
      "e2e/nuevo-project": 44966,
      "e2e/local-test-project-2": 44967,
    };
    // fixture landing page project data
    for (const filesKey in files) {
      fixtures.project({
        fixture: `projects/project_${files[filesKey]}.json`,
        name: `getProject-${filesKey}`,
        projectPath: filesKey,
        statistics: false,
      });
    }

    cy.visit("/v1");
    cy.wait("@getUserPreferences");
    cy.wait(Object.keys(files).map((filesKey) => `@getProject-${filesKey}`));

    cy.getDataCy("projects-container").should("be.visible");
    cy.getDataCy("projects-container").find(".bouncer").should("not.exist");
    cy.contains("Recently visited projects").should("be.visible");
    cy.contains("Pinned projects").should("be.visible");

    fixtures.userPreferences({
      fixture: "user-preferences/user-preferences-default.json",
      name: "getUserPreferencesNew",
    });

    cy.contains(".container-entity-listBar", "e2e/nuevo-project")
      .should("be.visible")
      .as("pickedProject");
    cy.get("@pickedProject")
      .find("[data-cy=pin-badge]")
      .should("be.visible")
      .contains("Unpin project from the dashboard")
      .parent()
      .click();

    cy.wait("@getUserPreferencesNew");
    cy.getDataCy("projects-container").should("be.visible");
    cy.getDataCy("projects-container").find(".bouncer").should("not.exist");
    cy.contains("Recently visited projects").should("be.visible");
    cy.contains("Pinned projects").should("not.exist");
    cy.contains(".container-entity-listBar", "e2e/nuevo-project")
      .should("be.visible")
      .as("pickedProjectPinned");
    cy.get("@pickedProjectPinned")
      .find("[data-cy=pin-badge]")
      .should("be.visible")
      .contains("Pin project to the dashboard");
  });

  it("has a maximum number of pins", () => {
    fixtures
      .config({
        overrides: {
          USER_PREFERENCES_MAX_PINNED_PROJECTS: 3,
        },
      })
      .entitySearch()
      .getLastVisitedProjects({
        fixture: "projects/last-visited-projects-5.json",
      })
      .sessionServersEmpty()
      .userPreferences({
        fixture: "user-preferences/user-preferences-3-pins.json",
      })
      .postPinnedProject();
    const files = {
      "lorenzo.cavazzi.tech/readme-file-dev": 30929,
      "e2e/testing-datasets": 43781,
      "e2e/local-test-project": 39646,
      "e2e/nuevo-project": 44966,
      "e2e/local-test-project-2": 44967,
    };
    // fixture landing page project data
    for (const filesKey in files) {
      fixtures.project({
        fixture: `projects/project_${files[filesKey]}.json`,
        name: `getProject-${filesKey}`,
        projectPath: filesKey,
        statistics: false,
      });
    }

    cy.visit("/v1");
    cy.wait("@getUserPreferences");
    cy.wait(Object.keys(files).map((filesKey) => `@getProject-${filesKey}`));

    cy.getDataCy("projects-container").should("be.visible");
    cy.getDataCy("projects-container").find(".bouncer").should("not.exist");
    cy.contains("Recently visited projects").should("be.visible");
    cy.contains("Pinned projects").should("be.visible");

    cy.contains(".container-entity-listBar", "e2e/local-test-project")
      .should("be.visible")
      .as("pickedProject");
    cy.get("@pickedProject")
      .find("[data-cy=pin-badge]")
      .should("be.visible")
      .and("be.disabled")
      .contains(
        "There are already 3 pinned projects. Unpin one if you want to pin this project."
      );
  });
});

describe("announce v2 banner", () => {
  beforeEach(() => {
    fixtures.config().versions().userTest().userPreferences();
  });

  it("v2 banner should be visible on the v1 dashboard", () => {
    fixtures
      .projects()
      .entitySearch({ fixture: "kgSearch/emptySearch.json", total: 0 })
      .getLastVisitedProjects({
        fixture: "projects/empty-last-visited-projects.json",
      })
      .noActiveProjects()
      .sessionServersEmpty();

    cy.visit("/v1");
    cy.wait("@getUser");
    cy.wait("@getDataServiceUser");
    cy.wait("@getEntities");
    cy.wait("@getLastVisitedProjects");
    cy.wait("@getNoActiveProjects");

    cy.getDataCy("announce-v2-banner").should("be.visible");

    // TODO -- go to search, banner should not be visible there
  });

  it("v2 banner should not be visible outside the v1 dashboard", () => {
    fixtures
      .projects()
      .entitySearch({ fixture: "kgSearch/emptySearch.json", total: 0 })
      .getLastVisitedProjects({
        fixture: "projects/empty-last-visited-projects.json",
      })
      .noActiveProjects()
      .sessionServersEmpty();

    cy.visit("/v1/search");
    cy.wait("@getUser");
    cy.wait("@getDataServiceUser");
    cy.wait("@getEntities");

    cy.getDataCy("announce-v2-banner").should("not.exist");
  });
});

describe("anonymous dashboard", () => {
  beforeEach(() => {
    fixtures.config().versions().userNone();
  });

  it("user should be prompted to log in", () => {
    cy.visit("/v1");
    cy.contains("to view the Renku legacy dashboard").should("be.visible");
  });
});
