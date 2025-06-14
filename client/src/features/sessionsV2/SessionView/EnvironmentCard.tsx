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

import { skipToken } from "@reduxjs/toolkit/query";
import cx from "classnames";
import { ReactNode, useContext, useEffect } from "react";
import { CircleFill, Clock } from "react-bootstrap-icons";
import { Badge, Card, CardBody, Col, Row } from "reactstrap";

import { RtkOrNotebooksError } from "../../../components/errors/RtkErrorAlert";
import { ErrorLabel } from "../../../components/formlabels/FormLabels";
import { Loader } from "../../../components/Loader";
import AppContext from "../../../utils/context/appContext";
import { DEFAULT_APP_PARAMS } from "../../../utils/context/appParams.constants";
import useAppDispatch from "../../../utils/customHooks/useAppDispatch.hook";
import { toHumanDateTime } from "../../../utils/helpers/DateTimeUtils";
import type { SessionLauncher } from "../api/sessionLaunchersV2.api";
import {
  sessionLaunchersV2Api,
  useGetEnvironmentsByEnvironmentIdBuildsQuery as useGetBuildsQuery,
} from "../api/sessionLaunchersV2.api";
import { EnvironmentIcon } from "../components/SessionForm/LauncherEnvironmentIcon";
import { BUILDER_IMAGE_NOT_READY_VALUE } from "../session.constants";
import { safeStringify } from "../session.utils";
import {
  BuildActions,
  BuildErrorReason,
  BuildStatusBadge,
  BuildStatusDescription,
} from "../components/BuildStatusComponents";

export default function EnvironmentCard({
  launcher,
}: {
  launcher: SessionLauncher;
}) {
  const { params } = useContext(AppContext);
  const imageBuildersEnabled =
    params?.IMAGE_BUILDERS_ENABLED ?? DEFAULT_APP_PARAMS.IMAGE_BUILDERS_ENABLED;

  const environment = launcher.environment;

  if (!environment) {
    return null;
  }

  const { environment_kind, name } = environment;
  const cardName = environment_kind === "GLOBAL" ? name || "" : launcher.name;

  const buildActions = imageBuildersEnabled &&
    launcher.environment.environment_kind === "CUSTOM" &&
    launcher.environment.environment_image_source === "build" && (
      <BuildActions launcher={launcher} />
    );

  return (
    <>
      <Card className={cx("border")}>
        <CardBody className={cx("d-flex", "flex-column")}>
          <Row>
            <Col
              xs={12}
              className={cx(
                "d-flex",
                "flex-wrap",
                "flex-sm-nowrap",
                "align-items-start",
                "justify-content-between",
                "pb-2",
                "gap-2"
              )}
            >
              <h5 className={cx("fw-bold", "mb-0", "text-break")}>
                <small>{cardName}</small>
              </h5>
              {buildActions}
            </Col>
            <EnvironmentRow>
              {environment.environment_kind === "GLOBAL" ? (
                <>
                  <EnvironmentIcon type="global" />
                  Global environment
                </>
              ) : environment.environment_image_source === "build" ? (
                <>
                  <EnvironmentIcon type="codeBased" size={16} />
                  Code based environment
                </>
              ) : (
                <>
                  <EnvironmentIcon type="custom" size={16} />
                  Custom image environment
                </>
              )}
            </EnvironmentRow>
            {environment_kind === "GLOBAL" && (
              <>
                <EnvironmentRow>
                  {environment?.description ? (
                    <p>{environment.description}</p>
                  ) : (
                    <p className="fst-italic mb-0">No description</p>
                  )}
                </EnvironmentRow>
                <EnvironmentRowWithLabel
                  label="Container image"
                  value={environment?.container_image || ""}
                />
                <EnvironmentRow>
                  <Clock size="16" className="flex-shrink-0" />
                  Created by <strong>Renku</strong> on{" "}
                  {toHumanDateTime({
                    datetime: launcher.creation_date,
                    format: "date",
                  })}
                </EnvironmentRow>
              </>
            )}
            {environment_kind === "CUSTOM" && (
              <>
                <CustomEnvironmentValues launcher={launcher} />
              </>
            )}
          </Row>
        </CardBody>
      </Card>
    </>
  );
}

function CustomEnvironmentValues({ launcher }: { launcher: SessionLauncher }) {
  const { environment } = launcher;

  if (environment.environment_image_source === "image") {
    return <CustomImageEnvironmentValues launcher={launcher} />;
  }

  return <CustomBuildEnvironmentValues launcher={launcher} />;
}

function CustomImageEnvironmentValues({
  launcher,
}: {
  launcher: SessionLauncher;
}) {
  const environment = launcher.environment;

  if (environment.environment_kind !== "CUSTOM") {
    return null;
  }

  return (
    <>
      <EnvironmentRowWithLabel
        label="Container image"
        value={environment?.container_image || ""}
      />
      <EnvironmentRowWithLabel
        label="Default URL path"
        value={environment.default_url}
      />
      <EnvironmentRowWithLabel label="Port" value={environment.port} />
      <EnvironmentRowWithLabel
        label="Working directory"
        value={environment.working_directory}
      />
      <EnvironmentRowWithLabel
        label="Mount directory"
        value={environment.mount_directory}
      />
      <EnvironmentRowWithLabel label="UID" value={environment.uid} />
      <EnvironmentRowWithLabel label="GID" value={environment.gid} />
      <EnvironmentJSONArrayRowWithLabel
        label="Command"
        value={safeStringify(environment.command)}
      />
      <EnvironmentJSONArrayRowWithLabel
        label="Args"
        value={safeStringify(environment.args)}
      />
    </>
  );
}

function CustomBuildEnvironmentValues({
  launcher,
}: {
  launcher: SessionLauncher;
}) {
  const { params } = useContext(AppContext);
  const imageBuildersEnabled =
    params?.IMAGE_BUILDERS_ENABLED ?? DEFAULT_APP_PARAMS.IMAGE_BUILDERS_ENABLED;

  const { environment } = launcher;

  const {
    data: builds,
    isLoading,
    error,
  } = useGetBuildsQuery(
    imageBuildersEnabled && environment.environment_image_source === "build"
      ? { environmentId: environment.id }
      : skipToken
  );

  const lastBuild = builds?.at(0);
  const lastSuccessfulBuild = builds?.find(
    (build) => build.status === "succeeded" && build.id !== lastBuild?.id
  );

  sessionLaunchersV2Api.endpoints.getEnvironmentsByEnvironmentIdBuilds.useQuerySubscription(
    lastBuild?.status === "in_progress"
      ? { environmentId: environment.id }
      : skipToken,
    {
      pollingInterval: 1_000,
    }
  );

  // Invalidate launchers if the container image is not the same as the
  // image from the last successful build
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (
      lastBuild?.status === "succeeded" &&
      lastBuild.result.image !== launcher.environment.container_image
    ) {
      dispatch(sessionLaunchersV2Api.endpoints.invalidateLaunchers.initiate());
    }
  }, [dispatch, lastBuild, launcher.environment.container_image]);

  if (environment.environment_image_source !== "build") {
    return null;
  }

  const { build_parameters } = environment;
  const { builder_variant, frontend_variant, repository } = build_parameters;

  return (
    <>
      <EnvironmentRow>
        {environment.container_image === BUILDER_IMAGE_NOT_READY_VALUE ? (
          <NotReadyStatusBadge />
        ) : (
          <>
            <ReadyStatusBadge />
            {lastSuccessfulBuild && (
              <BuildStatusDescription
                isOldImage={
                  lastBuild?.status !== "succeeded" && !!lastSuccessfulBuild
                }
                status={lastSuccessfulBuild?.status}
                createdAt={lastSuccessfulBuild?.created_at}
                completedAt={
                  lastSuccessfulBuild?.status === "succeeded"
                    ? lastSuccessfulBuild?.result?.completed_at
                    : undefined
                }
              />
            )}
          </>
        )}
      </EnvironmentRow>
      {!imageBuildersEnabled && (
        <EnvironmentRow>
          <p className={cx("mb-0", "alert", "alert-danger")}>
            This session environment is not currently supported by this instance
            of RenkuLab. Contact an administrator to learn more.
          </p>
        </EnvironmentRow>
      )}
      <EnvironmentRow>
        {isLoading ? (
          <span>
            <Loader className="me-1" inline size={16} />
            Loading build status...
          </span>
        ) : error || !builds ? (
          <div>
            <p className="mb-0">Error: could not load build status</p>
            {error && <RtkOrNotebooksError error={error} dismissible={false} />}
          </div>
        ) : lastBuild == null ? (
          <span className="fst-italic">
            This session environment does not have a build yet.
          </span>
        ) : (
          <div className="d-block">
            <label className={cx("text-nowrap", "mb-0", "me-2")}>
              Last build status:
            </label>
            <span>
              <BuildStatusBadge status={lastBuild.status} />
            </span>
          </div>
        )}
      </EnvironmentRow>

      {lastBuild && lastBuild.status === "failed" && (
        <BuildErrorReason build={lastBuild} />
      )}
      <EnvironmentRowWithLabel
        label="Built from code repository"
        value={repository || ""}
      />
      <EnvironmentRowWithLabel
        label="Environment type"
        value={builder_variant || ""}
      />
      <EnvironmentRowWithLabel
        label="User interface"
        value={frontend_variant || ""}
      />

      {environment.container_image !== BUILDER_IMAGE_NOT_READY_VALUE && (
        <CustomImageEnvironmentValues launcher={launcher} />
      )}
    </>
  );
}

function EnvironmentRow({ children }: { children?: ReactNode }) {
  return (
    <Col
      xs={12}
      className={cx("d-flex", "align-items-center", "py-2", "gap-2")}
    >
      {children}
    </Col>
  );
}

function EnvironmentRowWithLabel({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <EnvironmentRow>
      <div className="d-block">
        <label className={cx("text-nowrap", "mb-0", "me-2")}>{label}:</label>
        <code>{value ?? "-"}</code>
      </div>
    </EnvironmentRow>
  );
}

function EnvironmentJSONArrayRowWithLabel({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <EnvironmentRow>
      <div className="d-block">
        <label className={cx("text-nowrap", "mb-0", "me-2")}>{label}:</label>
        {value === null ? (
          <ErrorLabel text={"Invalid JSON array value"} />
        ) : (
          <code> {value} </code>
        )}
      </div>
    </EnvironmentRow>
  );
}

function ReadyStatusBadge() {
  return (
    <Badge
      className={cx(
        "border",
        "bg-success-subtle",
        "border-success",
        "text-success-emphasis",
        "fs-small",
        "fw-normal"
      )}
      pill
    >
      <CircleFill className={cx("bi", "me-1")} />
      Ready
    </Badge>
  );
}

function NotReadyStatusBadge() {
  return (
    <Badge
      className={cx(
        "border",
        "bg-danger-subtle",
        "border-danger",
        "text-danger-emphasis",
        "fs-small",
        "fw-normal"
      )}
      pill
    >
      <CircleFill className={cx("bi", "me-1")} />
      Not ready
    </Badge>
  );
}
