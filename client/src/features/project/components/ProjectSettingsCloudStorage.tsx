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

import cx from "classnames";
import { ReactNode } from "react";
import { Col, Container, Row } from "reactstrap";

import { ACCESS_LEVELS } from "../../../api-client";
import { ErrorAlert, InfoAlert, WarnAlert } from "../../../components/Alert";
import { Loader } from "../../../components/Loader";
import { RtkOrNotebooksError } from "../../../components/errors/RtkErrorAlert";
import LoginAlert from "../../../components/loginAlert/LoginAlert";
import { User } from "../../../model/renkuModels.types";
import useLegacySelector from "../../../utils/customHooks/useLegacySelector.hook";
import { useGetNotebooksVersionQuery } from "../../versions/versions.api";
import { NotebooksVersion } from "../../versions/versions.types";
import { StateModelProject } from "../project.types";
import AddOrEditCloudStorageButton from "./cloudStorage/AddOrEditCloudStorageButton";
import CloudStorageItem from "./cloudStorage/CloudStorageItem";
import {
  useGetStorageQuery,
  type CloudStorageGet,
} from "./cloudStorage/api/projectCloudStorage.api";

export default function ProjectSettingsCloudStorage() {
  const logged = useLegacySelector<User["logged"]>(
    (state) => state.stateModel.user.logged
  );

  const { accessLevel, id: projectId } = useLegacySelector<
    StateModelProject["metadata"]
  >((state) => state.stateModel.project.metadata);
  const devAccess = accessLevel >= ACCESS_LEVELS.DEVELOPER;

  const {
    data: storageForProject,
    error: storageError,
    isFetching: storageIsFetching,
    isLoading: storageIsLoading,
  } = useGetStorageQuery({
    storageParams: { project_id: `${projectId}` },
  });
  const {
    data: notebooksVersion,
    error: versionError,
    isFetching: versionIsFetching,
    isLoading: versionIsLoading,
  } = useGetNotebooksVersionQuery();

  const error = storageError || versionError;
  const isFetching = storageIsFetching || versionIsFetching;
  const isLoading = storageIsLoading || versionIsLoading;

  if (isLoading) {
    return (
      <CloudStorageSection>
        <Loader />
      </CloudStorageSection>
    );
  }

  if (!storageForProject || !notebooksVersion || error) {
    return (
      <CloudStorageSection>
        {error ? (
          <RtkOrNotebooksError error={error} />
        ) : (
          <ErrorAlert dismissible={false}>
            <h3 className={cx("fs-6", "fw-bold")}>
              Error loading cloud storage settings.
            </h3>
          </ErrorAlert>
        )}
      </CloudStorageSection>
    );
  }

  return (
    <CloudStorageSection isFetching={isFetching}>
      {!devAccess && (
        <InfoAlert dismissible={false} timeout={0}>
          <p className="mb-0">
            Cloud storage settings can be accessed only by project owners,
            maintainers and developers.
          </p>
          {!logged && (
            <p className={cx("mt-3", "mb-0")}>
              <LoginAlert
                logged={false}
                noWrapper={true}
                textPre="You can"
                textPost="here."
              />
            </p>
          )}
        </InfoAlert>
      )}
      <CloudStorageSupportNotice notebooksVersion={notebooksVersion} />

      {notebooksVersion.cloudStorageEnabled && (
        <Row>
          <Col>
            <AddOrEditCloudStorageButton devAccess={devAccess} />
          </Col>
        </Row>
      )}

      <CloudStorageList
        devAccess={devAccess}
        storageForProject={storageForProject}
      />
    </CloudStorageSection>
  );
}

function CloudStorageSection({
  isFetching,
  children,
}: {
  isFetching?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="mt-2" data-cy="cloud-storage-section">
      <h3>
        Cloud storage settings
        {isFetching && <Loader className="ms-1" inline size={20} />}
      </h3>
      <p>Here you can configure cloud storage to be used during sessions.</p>
      <div>{children}</div>
    </div>
  );
}

interface CloudStorageSupportNoticeProps {
  notebooksVersion: NotebooksVersion;
}

function CloudStorageSupportNotice({
  notebooksVersion,
}: CloudStorageSupportNoticeProps) {
  if (!notebooksVersion.cloudStorageEnabled) {
    return (
      <WarnAlert dismissible={false}>
        <p>
          This instance of RenkuLab does not support mounting cloud storage in
          sessions.
        </p>
      </WarnAlert>
    );
  }
  return null;
}

interface CloudStorageListProps {
  devAccess: boolean;
  storageForProject: CloudStorageGet[];
}

function CloudStorageList({
  devAccess,
  storageForProject,
}: CloudStorageListProps) {
  if (storageForProject.length == 0) {
    return null;
  }

  return (
    <Container className={cx("p-0", "mt-2")} fluid data-cy="cloud-storage-rows">
      <Row className={cx("row-cols-1", "gy-2")}>
        {storageForProject.map((storageDefinition) => (
          <CloudStorageItem
            devAccess={devAccess}
            key={storageDefinition.storage.name}
            storageDefinition={storageDefinition}
          />
        ))}
      </Row>
    </Container>
  );
}
