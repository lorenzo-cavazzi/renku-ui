/*!
 * Copyright 2024 - Swiss Data Science Center (SDSC)
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

describe("Add new v2 group", () => {
  const newGroupName = "new group";
  const slug = "new-group";

  beforeEach(() => {
    fixtures.config().versions().userTest();
    fixtures
      .createGroupV2()
      .listNamespaceV2()
      .readGroupV2({ groupSlug: slug })
      .readGroupV2Namespace({ groupSlug: slug });
    cy.visit("/#create-group");
  });

  it("create a new group", () => {
    cy.contains("Create a new group").should("be.visible");
    cy.getDataCy("group-name-input").clear().type(newGroupName);
    cy.getDataCy("group-slug-toggle").click();
    cy.getDataCy("group-slug-input").should("have.value", slug);
    cy.getDataCy("group-create-button").click();

    cy.wait("@createGroupV2");
    cy.wait("@readGroupV2");
    cy.wait("@readGroupV2Namespace");
    cy.url().should("contain", `/g/${slug}`);
    cy.contains("test 2 group-v2").should("be.visible");
  });

  it("cannot create a new group with invalid slug", () => {
    cy.contains("Create a new group").should("be.visible");
    cy.getDataCy("group-name-input").clear().type(newGroupName);
    cy.getDataCy("group-slug-toggle").click();
    cy.getDataCy("group-slug-input").should("have.value", slug);

    cy.getDataCy("group-slug-input").clear().type(newGroupName);
    cy.getDataCy("group-create-button").click();
    cy.contains(
      "A valid slug can include lowercase letters, numbers, dots ('.'), hyphens ('-') and underscores ('_'), but must start with a letter or number and cannot end with '.git' or '.atom'."
    ).should("be.visible");

    cy.getDataCy("group-slug-input").clear().type(slug);
    cy.getDataCy("group-create-button").click();
    cy.wait("@createGroupV2");
    cy.wait("@readGroupV2");
    cy.wait("@readGroupV2Namespace");
    cy.url().should("contain", `/g/${slug}`);
    cy.contains("test 2 group-v2").should("be.visible");
  });
});

describe("Add new group -- not logged in", () => {
  beforeEach(() => {
    fixtures.config().versions().userNone();
    cy.visit("/user#create-group");
  });

  it("create a new group", () => {
    cy.contains("Only authenticated users can create new groups.").should(
      "be.visible"
    );
  });
});

describe("List v2 groups", () => {
  beforeEach(() => {
    fixtures.config().versions().userTest().namespaces();
    fixtures.projects().landingUserProjects().listManyGroupV2();
    cy.visit("/");
  });

  it("list groups", () => {
    cy.contains("My groups").should("be.visible");
    cy.contains("test 1 group-v2").should("exist");
    cy.getDataCy("dashboard-group-list")
      .find("a")
      .its("length")
      .should("eq", 5);
  });

  it("shows groups", () => {
    fixtures.readGroupV2().readGroupV2Namespace();
    cy.contains("My groups").should("be.visible");
    cy.contains("test 2 group-v2").should("be.visible").click();
    cy.wait("@readGroupV2");
    cy.contains("test 2 group-v2").should("be.visible");
  });
});

describe("Edit v2 group", () => {
  beforeEach(() => {
    fixtures
      .config()
      .versions()
      .userTest()
      .dataServicesUser({
        response: {
          id: "0945f006-e117-49b7-8966-4c0842146313",
          username: "user-1",
          email: "user1@email.com",
        },
      })
      .namespaces();
    fixtures.projects().landingUserProjects().listGroupV2();
    cy.visit("/");
  });

  it("shows a group", () => {
    fixtures
      .readGroupV2()
      .readGroupV2Namespace()
      .listGroupV2Members()
      .listProjectV2ByNamespace()
      .listDataConnectors({ namespace: "test-2-group-v2" });
    cy.contains("My groups").should("be.visible");
    cy.contains("test 2 group-v2").should("be.visible").click();
    cy.wait("@readGroupV2");
    cy.contains("test 2 group-v2").should("be.visible");
    cy.contains("public-storage").should("be.visible");
  });

  it("shows a group by old URL", () => {
    fixtures
      .readGroupV2()
      .readGroupV2Namespace()
      .listGroupV2Members()
      .listProjectV2ByNamespace()
      .listDataConnectors({ namespace: "test-2-group-v2" });
    cy.visit("/v2/groups/test-2-group-v2");
    cy.wait("@readGroupV2");
    cy.contains("test 2 group-v2").should("be.visible");
    cy.contains("public-storage").should("be.visible");
  });

  it("allows editing group metadata", () => {
    fixtures
      .readGroupV2()
      .readGroupV2Namespace()
      .getGroupV2Permissions()
      .listGroupV2Members()
      .updateGroupV2();
    cy.contains("My groups").should("be.visible");
    cy.contains("test 2 group-v2").should("be.visible").click();
    cy.wait("@readGroupV2");
    cy.contains("test 2 group-v2").should("be.visible");
    cy.getDataCy("nav-link-settings").should("be.visible").click();
    cy.getDataCy("group-name-input").clear().type("new name");
    cy.getDataCy("group-slug-input").clear().type("new-slug");
    cy.getDataCy("group-description-input").clear().type("new description");
    fixtures
      .readGroupV2({
        fixture: "groupV2/update-groupV2-metadata.json",
        groupSlug: "new-slug",
        name: "readPostUpdate",
      })
      .readGroupV2Namespace({
        fixture: "groupV2/update-groupV2-namespace.json",
        groupSlug: "new-slug",
        name: "readNamespacePostUpdate",
      });
    cy.get("button").contains("Update").should("be.visible").click();
    cy.wait("@updateGroupV2");
    cy.wait("@readPostUpdate");
    cy.wait("@readNamespacePostUpdate");
    cy.contains("new name").should("be.visible");
  });

  it("allows changing group members", () => {
    const groupMemberToRemove = "user3-uuid";
    fixtures
      .deleteGroupV2Member({ userId: groupMemberToRemove })
      .searchV2ListProjects({ numberOfProjects: 0, numberOfUsers: 5 })
      .getGroupV2Permissions()
      .listGroupV2Members()
      .readGroupV2()
      .readGroupV2Namespace();

    cy.contains("My groups").should("be.visible");
    cy.contains("test 2 group-v2").should("be.visible").click();
    cy.wait("@readGroupV2");
    cy.contains("test 2 group-v2").should("be.visible");
    cy.getDataCy("nav-link-settings").should("be.visible").click();
    cy.contains("@user1").should("be.visible");
    cy.contains("user3-uuid").should("be.visible");
    fixtures
      .deleteGroupV2Member({ userId: groupMemberToRemove })
      .listGroupV2Members({ removeUserId: groupMemberToRemove });
    cy.getDataCy("group-member-actions-2")
      .find('[data-cy="button-with-menu-dropdown"]')
      .click();
    cy.getDataCy("group-member-actions-2").contains("Remove").click();
    cy.getDataCy("remove-group-member-modal").should("be.visible");
    cy.contains("button", "Remove member").should("be.visible").click();
    cy.getDataCy("remove-group-member-modal").should("not.be.visible");
    cy.contains("user3-uuid").should("not.exist");
    cy.get("[data-cy=group-add-member]").should("be.visible").click();
    cy.getDataCy("add-project-member").type("foo");
    cy.contains("Foo_1002").should("be.visible").click();
    fixtures.patchGroupV2Member().listGroupV2Members({
      addMember: {
        id: "id_1002",
        role: "member",
        first_name: "Foo_1002",
        last_name: "Bar_1002",
        namespace: "FooBar_1002",
      },
      removeUserId: groupMemberToRemove,
    });
    cy.get("button").contains("Add Member").should("be.visible").click();
    cy.contains("Foo_1002 Bar_1002").should("be.visible");

    cy.get("[data-cy=group-add-member]").should("be.visible").click();
    cy.getDataCy("add-project-member").type("noone");
    cy.contains("0 users found.").should("be.visible");
  });

  it("deletes group", () => {
    fixtures
      .readGroupV2()
      .readGroupV2Namespace()
      .getGroupV2Permissions()
      .listGroupV2Members()
      .deleteGroupV2();
    cy.contains("My groups").should("be.visible");
    cy.contains("test 2 group-v2").should("be.visible").click();
    cy.wait("@readGroupV2");
    cy.contains("test 2 group-v2").should("be.visible");
    cy.getDataCy("nav-link-settings").should("be.visible").click();
    cy.getDataCy("group-description-input").clear().type("new description");
    cy.get("button").contains("Delete").should("be.visible").click();
    cy.get("button")
      .contains("Yes, delete")
      .should("be.visible")
      .should("be.disabled");
    cy.contains("Please type test-2-group-v2").should("be.visible");
    cy.getDataCy("delete-confirmation-input").clear().type("test-2-group-v2");
    fixtures.postDeleteReadGroupV2();
    cy.get("button").contains("Yes, delete").should("be.enabled").click();
    cy.wait("@deleteGroupV2");
    cy.wait("@postDeleteReadGroupV2");

    fixtures.listGroupV2({
      fixture: "groupV2/list-groupV2-post-delete.json",
      name: "listGroupV2PostDelete",
    });
    cy.contains("Group test 2 group-v2 has been successfully deleted.").should(
      "be.visible"
    );
  });
});

describe("Work with group data connectors", () => {
  beforeEach(() => {
    fixtures
      .config()
      .versions()
      .userTest()
      .dataServicesUser({
        response: {
          id: "0945f006-e117-49b7-8966-4c0842146313",
          username: "user-1",
          email: "user1@email.com",
        },
      })
      .projects()
      .landingUserProjects()
      .listNamespaceV2()
      .listGroupV2()
      .readGroupV2()
      .readGroupV2Namespace()
      .getGroupV2Permissions()
      .listGroupV2Members()
      .listProjectV2ByNamespace()
      .listDataConnectors({ namespace: "test-2-group-v2" })
      .getStorageSchema({ fixture: "cloudStorage/storage-schema-s3.json" });
    cy.visit("/");
  });

  it("shows group data connectors", () => {
    fixtures
      .dataConnectorSecrets({
        dataConnectorId: "ULID-2",
        fixture: "dataConnector/data-connector-secrets-empty.json",
      })
      .listDataConnectorProjectLinks({
        dataConnectorId: "ULID-2",
        fixture: "dataConnector/project-data-connector-links-multiple.json",
      })
      .readGroupV2Namespace()
      .readProjectV2ById({ projectId: "PROJECT-ULID-1", name: "readProject1" })
      .readProjectV2ById({ projectId: "PROJECT-ULID-2", name: "readProject2" })
      .readProjectV2ById({ projectId: "PROJECT-ULID-3", name: "readProject2" });
    cy.contains("My groups").should("be.visible");
    cy.contains("test 2 group-v2").should("be.visible").click();
    cy.wait("@readGroupV2");
    cy.contains("test 2 group-v2").should("be.visible");
    cy.contains("public-storage").should("be.visible").click();
    cy.wait("@listDataConnectorProjectLinks");
    cy.wait("@readProject1");
    cy.wait("@readProject2");
    cy.contains("user1-uuid/test-2-v2-project").should("be.visible");
  });

  it("add a group data connector", () => {
    fixtures.testCloudStorage({ success: false }).postDataConnector({
      namespace: "test-2-group-v2",
      slug: "example-storage-no-credentials",
    });
    cy.contains("test 2 group-v2").should("be.visible").click();
    cy.wait("@readGroupV2");
    cy.contains("public-storage").should("be.visible");
    cy.wait("@getGroupV2Permissions");
    cy.getDataCy("add-data-connector").should("be.visible").click();
    // Pick a provider
    cy.getDataCy("data-storage-s3").click();
    cy.getDataCy("data-provider-AWS").click();
    cy.getDataCy("data-connector-edit-next-button").click();

    // Fill out the details
    cy.get("#sourcePath").type("bucket/my-source");
    cy.get("#access_key_id").type("access key");
    cy.get("#secret_access_key").type("secret key");
    cy.getDataCy("test-data-connector-button").click();
    cy.getDataCy("add-data-connector-continue-button").contains("Skip").click();
    cy.getDataCy("data-connector-edit-mount").within(() => {
      cy.get("#name").type("example storage without credentials");
      cy.get("#data-connector-slug").should(
        "have.value",
        "example-storage-without-credentials"
      );
      cy.get("#data-connector-slug")
        .clear()
        .type("example-storage-no-credentials");
    });
    cy.getDataCy("data-connector-edit-update-button").click();
    cy.wait("@postDataConnector");
    cy.getDataCy("data-connector-edit-body").should(
      "contain.text",
      "The data connector test-2-group-v2/example-storage-no-credentials has been successfully added."
    );
    cy.getDataCy("data-connector-edit-close-button").click();
    cy.wait("@listDataConnectors");
  });

  it("edit a group data connector", () => {
    fixtures
      .getDataConnectorPermissions({ dataConnectorId: "ULID-2" })
      .testCloudStorage({ success: true })
      .patchDataConnector({ namespace: "test-2-group-v2" });
    cy.contains("test 2 group-v2").should("be.visible").click();
    cy.wait("@readGroupV2");
    cy.contains("public-storage").should("be.visible").click();
    cy.getDataCy("data-connector-edit").should("be.visible").click();
    // Fill out the details
    cy.getDataCy("test-data-connector-button").click();
    cy.getDataCy("add-data-connector-continue-button")
      .contains("Continue")
      .click();
    cy.getDataCy("data-connector-edit-update-button").click();
    cy.wait("@patchDataConnector");
    cy.getDataCy("data-connector-edit-body").should(
      "contain.text",
      "The data connector test-2-group-v2/public-storage has been successfully updated."
    );
    cy.getDataCy("data-connector-edit-close-button").click();
    cy.wait("@listDataConnectors");
  });

  it("delete a group data connector", () => {
    fixtures
      .deleteDataConnector()
      .getDataConnectorPermissions({ dataConnectorId: "ULID-2" })
      .listDataConnectorProjectLinks({
        dataConnectorId: "ULID-2",
        fixture: "dataConnector/project-data-connector-links-multiple.json",
      });
    cy.contains("test 2 group-v2").should("be.visible").click();
    cy.wait("@readGroupV2");
    cy.contains("public-storage").should("be.visible").click();
    cy.getDataCy("button-with-menu-dropdown").should("be.visible").click();
    cy.getDataCy("data-connector-delete").should("be.visible").click();
    cy.contains("Are you sure you want to delete this data connector").should(
      "be.visible"
    );
    cy.getDataCy("delete-confirmation-input").clear().type("public-storage");
    cy.getDataCy("delete-data-connector-modal-button")
      .should("be.visible")
      .click();
    cy.wait("@deleteDataConnector");
    cy.wait("@listDataConnectors");
  });
});

describe("Work with group data connectors, missing permissions", () => {
  beforeEach(() => {
    fixtures
      .config()
      .versions()
      .userTest()
      .dataServicesUser({
        response: {
          id: "0945f006-e117-49b7-8966-4c0842146313",
          username: "user-1",
          email: "user1@email.com",
        },
      })
      .projects()
      .landingUserProjects()
      .listNamespaceV2()
      .listGroupV2()
      .readGroupV2()
      .readGroupV2Namespace()
      .getGroupV2Permissions({
        fixture: "groupV2/groupV2-permissions-none.json",
      })
      .listGroupV2Members()
      .listProjectV2ByNamespace()
      .listDataConnectors({ namespace: "test-2-group-v2" })
      .getStorageSchema({ fixture: "cloudStorage/storage-schema-s3.json" });
    cy.visit("/");
  });

  it("shows group data connectors", () => {
    fixtures
      .dataConnectorSecrets({
        dataConnectorId: "ULID-2",
        fixture: "dataConnector/data-connector-secrets-empty.json",
      })
      .listDataConnectorProjectLinks({
        dataConnectorId: "ULID-2",
        fixture: "dataConnector/project-data-connector-links-multiple.json",
      })
      .readGroupV2Namespace()
      .readProjectV2ById({ projectId: "PROJECT-ULID-1", name: "readProject1" })
      .readProjectV2ById({ projectId: "PROJECT-ULID-2", name: "readProject2" })
      .readProjectV2ById({ projectId: "PROJECT-ULID-3", name: "readProject2" });
    cy.contains("My groups").should("be.visible");
    cy.contains("test 2 group-v2").should("be.visible").click();
    cy.wait("@readGroupV2");
    cy.contains("test 2 group-v2").should("be.visible");
    cy.contains("public-storage").should("be.visible").click();
    cy.wait("@listDataConnectorProjectLinks");
    cy.wait("@readProject1");
    cy.wait("@readProject2");
    cy.contains("user1-uuid/test-2-v2-project").should("be.visible");
  });

  it("add a group data connector", () => {
    fixtures.testCloudStorage({ success: false }).postDataConnector({
      namespace: "test-2-group-v2",
      slug: "example-storage-no-credentials",
    });
    cy.contains("test 2 group-v2").should("be.visible").click();
    cy.wait("@readGroupV2");
    cy.contains("public-storage").should("be.visible");
    cy.wait("@getGroupV2Permissions");
    cy.getDataCy("add-data-connector").should("not.exist");
  });

  it("edit a group data connector", () => {
    cy.contains("test 2 group-v2").should("be.visible").click();
    cy.wait("@readGroupV2");
    cy.contains("public-storage").should("be.visible").click();
    cy.getDataCy("data-connector-edit").should("not.exist");
  });

  it("delete a group data connector", () => {
    fixtures.listDataConnectorProjectLinks({
      dataConnectorId: "ULID-2",
      fixture: "dataConnector/project-data-connector-links-multiple.json",
    });
    cy.contains("test 2 group-v2").should("be.visible").click();
    cy.wait("@readGroupV2");
    cy.contains("public-storage").should("be.visible").click();
    cy.getDataCy("data-connector-delete").should("not.exist");
  });
});

describe("Create projects in a group", () => {
  beforeEach(() => {
    fixtures
      .config()
      .versions()
      .userTest()
      .dataServicesUser({
        response: {
          id: "0945f006-e117-49b7-8966-4c0842146313",
          username: "user-1",
          email: "user1@email.com",
        },
      })
      .listNamespaceV2()
      .listGroupV2()
      .readGroupV2()
      .readGroupV2Namespace()
      .getGroupV2Permissions()
      .listGroupV2Members()
      .listProjectV2ByNamespace()
      .listDataConnectors({ namespace: "test-2-group-v2" });
    cy.visit("/");
  });

  it("defaults namespace to the group", () => {
    fixtures.readGroupV2Namespace();
    cy.contains("My groups").should("be.visible");
    cy.contains("test 2 group-v2").should("be.visible").click();
    cy.wait("@readGroupV2");
    cy.contains("test 2 group-v2").should("be.visible");
    cy.getDataCy("group-create-project-button").click();
    cy.contains("Create a new project").should("be.visible");
    cy.findReactSelectSelectedValue(
      "project-creation-form-project-namespace-input",
      "namespace-select"
    )
      .contains("test-2-group-v2")
      .should("be.visible");
  });

  it("defaults namespace to the group on settings page", () => {
    fixtures.readGroupV2Namespace();
    cy.contains("My groups").should("be.visible");
    cy.contains("test 2 group-v2").should("be.visible").click();
    cy.wait("@readGroupV2");
    cy.contains("test 2 group-v2").should("be.visible");
    cy.getDataCy("nav-link-settings").should("be.visible").click();
    cy.getDataCy("navbar-new-entity").click();
    cy.getDataCy("navbar-project-new").click();
    cy.contains("Create a new project").should("be.visible");
    cy.findReactSelectSelectedValue(
      "project-creation-form-project-namespace-input",
      "namespace-select"
    )
      .contains("test-2-group-v2")
      .should("be.visible");
  });

  it("defaults namespace to the group when there are many groups", () => {
    // This fails because the group falls outside the first batch of groups
    fixtures
      .listManyNamespaceV2()
      .readGroupV2({ groupSlug: "test-20-group-v2" })
      .readGroupV2Namespace({ groupSlug: "test-20-group-v2" })
      .getGroupV2Permissions({ groupSlug: "test-20-group-v2" })
      .listGroupV2Members({ groupSlug: "test-20-group-v2" })
      .listProjectV2ByNamespace({ namespace: "test-20-group-v2" })
      .listDataConnectors({ namespace: "test-20-group-v2" });
    cy.visit("/g/test-20-group-v2");
    cy.wait("@readGroupV2");
    cy.getDataCy("group-create-project-button").click();
    cy.contains("Create a new project").should("be.visible");
    cy.wait("@readGroupV2Namespace");
    cy.wait("@listNamespaceV2");
    cy.findReactSelectSelectedValue(
      "project-creation-form-project-namespace-input",
      "namespace-select"
    )
      .contains("test-20-group-v2")
      .should("be.visible");
  });
});
