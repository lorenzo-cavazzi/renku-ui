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
 * limitations under the License
 */

import cx from "classnames";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Database,
  Link45deg,
  NodePlus,
  PlusLg,
  XLg,
} from "react-bootstrap-icons";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  ButtonGroup,
  Form,
  Input,
  Label,
  ModalBody,
  ModalFooter,
} from "reactstrap";

import { RtkOrNotebooksError } from "../../../../components/errors/RtkErrorAlert";
import { ExternalLink } from "../../../../components/ExternalLinks";
import { Loader } from "../../../../components/Loader";
import ModalHeader from "../../../../components/modal/ModalHeader";
import ScrollableModal from "../../../../components/modal/ScrollableModal";
import useAppDispatch from "../../../../utils/customHooks/useAppDispatch.hook";
import useAppSelector from "../../../../utils/customHooks/useAppSelector.hook";
import {
  dataConnectorsApi,
  usePostDataConnectorsByDataConnectorIdProjectLinksMutation,
  usePostDataConnectorsGlobalMutation,
} from "../../../dataConnectorsV2/api/data-connectors.enhanced-api";
import { DATA_CONNECTORS_DOI_DOCS_URL } from "../../../dataConnectorsV2/components/dataConnector.constants";
import DataConnectorModal, {
  DataConnectorModalBodyAndFooter,
} from "../../../dataConnectorsV2/components/DataConnectorModal/index";
import dataConnectorFormSlice from "../../../dataConnectorsV2/state/dataConnectors.slice";
import type { Project } from "../../../projectsV2/api/projectV2.api";
import { projectV2Api } from "../../../projectsV2/api/projectV2.enhanced-api";

import styles from "../../../dataConnectorsV2/components/DataConnectorModal/DataConnectorModal.module.scss";

interface ProjectConnectDataConnectorsModalProps
  extends Omit<
    Parameters<typeof DataConnectorModal>[0],
    "dataConnector" | "projectId"
  > {
  project: Project;
}

type ProjectConnectDataConnectorMode = "create" | "link" | "doi";

export default function ProjectConnectDataConnectorsModal({
  isOpen,
  namespace,
  project,
  toggle: originalToggle,
}: ProjectConnectDataConnectorsModalProps) {
  const [mode, setMode] = useState<ProjectConnectDataConnectorMode>("link");
  const dispatch = useAppDispatch();
  const toggle = useCallback(() => {
    dispatch(dataConnectorFormSlice.actions.resetTransientState());
    originalToggle();
  }, [dispatch, originalToggle]);
  return (
    <ScrollableModal
      backdrop="static"
      centered
      className={styles.modal}
      data-cy="project-data-connector-connect-modal"
      fullscreen="lg"
      id={"connect-project-data-connector"}
      isOpen={isOpen}
      size="lg"
      unmountOnClose={false}
      toggle={toggle}
    >
      <ModalHeader
        modalTitle={<ProjectConnectDataConnectorModalTitle />}
        toggle={toggle}
        data-cy="project-data-connector-connect-header"
      >
        <ProjectConnectDataConnectorModeSwitch mode={mode} setMode={setMode} />
      </ModalHeader>
      {mode === "create" ? (
        <ProjectCreateDataConnectorBodyAndFooter
          {...{
            isOpen,
            namespace,
            project,
            toggle,
          }}
        />
      ) : mode === "link" ? (
        <ProjectLinkDataConnectorBodyAndFooter
          {...{
            isOpen,
            namespace,
            project,
            toggle,
          }}
        />
      ) : (
        <ProjectDoiDataConnectorBodyAndFooter
          {...{
            isOpen,
            namespace,
            project,
            toggle,
          }}
        />
      )}
    </ScrollableModal>
  );
}

function ProjectConnectDataConnectorModalTitle() {
  const { flatDataConnector, cloudStorageState } = useAppSelector(
    (state) => state.dataConnectorFormSlice
  );

  const title =
    cloudStorageState?.step > 1
      ? `${flatDataConnector?.schema ?? ""} ${
          flatDataConnector?.provider ?? ""
        }`
      : "";
  return (
    <>
      <Database className={cx("bi", "me-1")} />
      {/* // ! TODO: adjust this */}
      Link or create data connector {title.trim()}
    </>
  );
}

function ProjectConnectDataConnectorModeSwitch({
  mode,
  setMode,
}: {
  mode: ProjectConnectDataConnectorMode;
  setMode: (mode: ProjectConnectDataConnectorMode) => void;
}) {
  return (
    <ButtonGroup>
      <Input
        type="radio"
        className="btn-check"
        id="project-data-controller-mode-link"
        value="link"
        checked={mode === "link"}
        onChange={() => {
          setMode("link");
        }}
      />
      <Label
        data-cy="project-data-controller-mode-link"
        for="project-data-controller-mode-link"
        className={cx("btn", "btn-outline-primary", "mb-0")}
      >
        <NodePlus className={cx("bi", "me-1")} />
        Link a data connector
      </Label>

      <Input
        type="radio"
        className="btn-check"
        id="project-data-controller-mode-doi"
        value="link"
        checked={mode === "doi"}
        onChange={() => {
          setMode("doi");
        }}
      />
      <Label
        data-cy="project-data-controller-mode-doi"
        for="project-data-controller-mode-doi"
        className={cx(
          "btn",
          "btn-outline-primary",
          "mb-0",
          "border-end-0",
          "border-start-0"
        )}
      >
        <Link45deg className={cx("bi", "me-1")} />
        Import data by DOI
      </Label>

      <Input
        type="radio"
        className="btn-check"
        id="project-data-controller-mode-create"
        value="create"
        checked={mode === "create"}
        onChange={() => {
          setMode("create");
        }}
      />
      <Label
        data-cy="project-data-controller-mode-create"
        for="project-data-controller-mode-create"
        className={cx("btn", "btn-outline-primary", "mb-0")}
      >
        <PlusLg className={cx("bi", "me-1")} />
        Create a data connector
      </Label>
    </ButtonGroup>
  );
}

function ProjectCreateDataConnectorBodyAndFooter({
  isOpen,
  namespace,
  project,
  toggle,
}: ProjectConnectDataConnectorsModalProps) {
  return (
    <DataConnectorModalBodyAndFooter
      dataConnector={null}
      {...{
        isOpen,
        namespace,
        project,
        toggle,
      }}
    />
  );
}

interface DataConnectorLinkFormFields {
  dataConnectorIdentifier: string;
}

function ProjectLinkDataConnectorBodyAndFooter({
  project,
  toggle,
}: ProjectConnectDataConnectorsModalProps) {
  const dispatch = useAppDispatch();

  const [fetchOnePartSlug, onePartSlugQuery] =
    dataConnectorsApi.endpoints.getDataConnectorsGlobalBySlug.useLazyQuery();
  const [fetchTwoPartsSlug, twoPartsSlugQuery] =
    dataConnectorsApi.endpoints.getNamespacesByNamespaceDataConnectorsAndSlug.useLazyQuery();
  const [fetchThreePartsSlug, threePartsSlugQuery] =
    dataConnectorsApi.endpoints.getNamespacesByNamespaceProjectsAndProjectDataConnectorsSlug.useLazyQuery();

  const [requestId, setRequestId] = useState<string>("");
  const currentQuery = useMemo(
    () =>
      onePartSlugQuery.requestId === requestId
        ? onePartSlugQuery
        : twoPartsSlugQuery.requestId === requestId
        ? twoPartsSlugQuery
        : threePartsSlugQuery.requestId === requestId
        ? threePartsSlugQuery
        : undefined,
    [requestId, onePartSlugQuery, twoPartsSlugQuery, threePartsSlugQuery]
  );

  const [
    linkDataConnector,
    { error: linkDataConnectorError, isLoading, isSuccess },
  ] = usePostDataConnectorsByDataConnectorIdProjectLinksMutation();
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<DataConnectorLinkFormFields>({
    defaultValues: {
      dataConnectorIdentifier: "",
    },
  });

  const onSubmit = useCallback(
    (values: DataConnectorLinkFormFields) => {
      const [part1, part2, part3] = values.dataConnectorIdentifier.split(
        "/",
        3
      );
      const { requestId } =
        part2 == null
          ? fetchOnePartSlug({
              slug: part1,
            })
          : part3 == null
          ? fetchTwoPartsSlug({
              namespace: part1,
              slug: part2,
            })
          : fetchThreePartsSlug({
              namespace: part1,
              project: part2,
              slug: part3,
            });
      setRequestId(requestId);
    },
    [fetchOnePartSlug, fetchThreePartsSlug, fetchTwoPartsSlug]
  );

  useEffect(() => {
    const dataConnector = currentQuery?.currentData;
    if (dataConnector == null) {
      return;
    }
    linkDataConnector({
      dataConnectorId: dataConnector.id,
      dataConnectorToProjectLinkPost: {
        project_id: project.id,
      },
    });
  }, [currentQuery?.currentData, linkDataConnector, project.id]);

  useEffect(() => {
    if (isSuccess) {
      dispatch(projectV2Api.util.invalidateTags(["DataConnectors"]));
      reset();
      toggle();
    }
  }, [dispatch, isSuccess, reset, toggle]);

  const error = currentQuery?.error ?? linkDataConnectorError;

  return (
    <Form noValidate onSubmit={handleSubmit(onSubmit)}>
      <ModalBody data-cy="data-connector-edit-body">
        <p className="text-body-secondary">
          Link an existing data connector to this project. Permission
          restrictions might apply to users accessing the project.
        </p>
        <div className="mb-3">
          <Label className="form-label" for="data-connector-identifier">
            Data connector identifier
          </Label>
          <Controller
            control={control}
            name="dataConnectorIdentifier"
            render={({ field }) => (
              <Input
                className={cx(
                  "form-control",
                  errors.dataConnectorIdentifier && "is-invalid"
                )}
                id="data-connector-identifier"
                placeholder="namespace/slug"
                type="text"
                {...field}
              />
            )}
            rules={{
              required: true,
              pattern: /^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+){0,2}$/,
            }}
          />
          <div className="form-text">
            Paste a data connector identifier. You can find it on the the data
            connector&apos;s side panel
          </div>
          <div className="invalid-feedback">
            {errors.dataConnectorIdentifier == null
              ? undefined
              : errors.dataConnectorIdentifier.message != null &&
                errors.dataConnectorIdentifier.message.length > 0
              ? errors.dataConnectorIdentifier.message
              : "Please provide an identifier for the data connector"}
          </div>
        </div>
        {error != null && <RtkOrNotebooksError error={error} />}
      </ModalBody>

      <ModalFooter className="border-top" data-cy="data-connector-edit-footer">
        <Button color="outline-primary" onClick={toggle}>
          <XLg className={cx("bi", "me-1")} />
          Cancel
        </Button>
        <Button
          color="primary"
          data-cy="link-data-connector-button"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? (
            <Loader className="me-1" inline size={16} />
          ) : (
            <NodePlus className={cx("bi", "me-1")} />
          )}
          Link data connector
        </Button>
      </ModalFooter>
    </Form>
  );
}

interface DataConnectorDoiFormFields {
  doi: string;
}

function ProjectDoiDataConnectorBodyAndFooter({
  project,
  toggle,
}: ProjectConnectDataConnectorsModalProps) {
  const dispatch = useAppDispatch();

  const [
    postDataConnector,
    {
      data: postDataConnectorData,
      error: postDataConnectorError,
      isLoading: postDataConnectorLoading,
      isSuccess: postDataConnectorSuccess,
    },
  ] = usePostDataConnectorsGlobalMutation();

  const [
    linkDataConnector,
    {
      error: linkDataConnectorError,
      isLoading: linkDataConnectorLoading,
      isSuccess: linkDataConnectorSuccess,
    },
  ] = usePostDataConnectorsByDataConnectorIdProjectLinksMutation();

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<DataConnectorDoiFormFields>({
    defaultValues: {
      doi: "",
    },
  });

  const error = postDataConnectorError ?? linkDataConnectorError;
  const isLoading = postDataConnectorLoading || linkDataConnectorLoading;

  const onSubmit = useCallback(
    (values: DataConnectorDoiFormFields) => {
      postDataConnector({
        globalDataConnectorPost: {
          storage: {
            configuration: {
              type: "doi",
              doi: values.doi,
            },
            source_path: "/",
            target_path: "/",
            readonly: true,
          },
        },
      });
    },
    [postDataConnector]
  );

  // Link the data connector to the project if creation was successful
  useEffect(() => {
    if (postDataConnectorSuccess && postDataConnectorData) {
      linkDataConnector({
        dataConnectorId: postDataConnectorData.id,
        dataConnectorToProjectLinkPost: {
          project_id: project.id,
        },
      });
    }
  }, [
    linkDataConnector,
    postDataConnectorData,
    postDataConnectorSuccess,
    project.id,
  ]);

  // Close the modal and reset the Form if linking was successful
  useEffect(() => {
    if (linkDataConnectorSuccess) {
      dispatch(projectV2Api.util.invalidateTags(["DataConnectors"]));
      reset();
      toggle();
    }
  }, [dispatch, linkDataConnectorSuccess, reset, toggle]);

  return (
    <Form noValidate onSubmit={handleSubmit(onSubmit)}>
      <ModalBody data-cy="data-connector-edit-body">
        <p className="text-body-secondary">
          Connect to data on Zenodo, Dataverse, and similar data repositories.
          More information{" "}
          <ExternalLink
            iconAfter={true}
            role="link"
            title="in our documentation"
            url={DATA_CONNECTORS_DOI_DOCS_URL}
          />
          .
        </p>
        <div className="mb-3">
          <Label className="form-label" for="data-connector-identifier">
            DOI
          </Label>
          <Controller
            control={control}
            name="doi"
            render={({ field }) => (
              <Input
                className={cx("form-control", errors.doi && "is-invalid")}
                id="doi"
                placeholder="DOI identifier"
                type="text"
                {...field}
              />
            )}
            rules={{
              required: true,
            }}
          />
          <div className="form-text">
            Paste a DOI, e.g. <code>10.5281/zenodo.3831980</code>.
          </div>
          <div className="invalid-feedback">Please provide a valid DOI</div>
        </div>
        {error !== null && <RtkOrNotebooksError error={error} />}
      </ModalBody>

      <ModalFooter className="border-top" data-cy="data-connector-edit-footer">
        <Button color="outline-primary" onClick={toggle}>
          <XLg className={cx("bi", "me-1")} />
          Cancel
        </Button>
        <Button
          color="primary"
          data-cy="doi-data-connector-button"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? (
            <Loader className="me-1" inline size={16} />
          ) : (
            <Link45deg className={cx("bi", "me-1")} />
          )}
          Import DOI as data connector
        </Button>
      </ModalFooter>
    </Form>
  );
}
