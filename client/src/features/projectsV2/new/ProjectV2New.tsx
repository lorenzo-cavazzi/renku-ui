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
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { generatePath, useNavigate } from "react-router-dom-v5-compat";
import {
  AccordionBody,
  AccordionHeader,
  AccordionItem,
  Button,
  Collapse,
  Form,
  FormText,
  Input,
  Label,
  UncontrolledAccordion,
} from "reactstrap";

import { RtkErrorAlert } from "../../../components/errors/RtkErrorAlert";
import FormSchema from "../../../components/formschema/FormSchema";
import { ABSOLUTE_ROUTES } from "../../../routing/routes.constants";
import useAppSelector from "../../../utils/customHooks/useAppSelector.hook";
import useLegacySelector from "../../../utils/customHooks/useLegacySelector.hook";

import type { ProjectPost } from "../api/projectV2.api";
import { usePostProjectsMutation } from "../api/projectV2.enhanced-api";

import LoginAlert from "../../../components/loginAlert/LoginAlert";
import WipBadge from "../shared/WipBadge";
import { ProjectV2DescriptionAndRepositories } from "../show/ProjectV2DescriptionAndRepositories";
import ProjectFormSubmitGroup from "./ProjectV2FormSubmitGroup";
import ProjectV2NewForm from "./ProjectV2NewForm";
import type { NewProjectV2State } from "./projectV2New.slice";
import { setCurrentStep, setMetadata } from "./projectV2New.slice";
import ContainerWrap from "../../../components/container/ContainerWrap";
import { Controller, useForm } from "react-hook-form";
import { NewProjectForm } from "./projectV2New.types";
import { INITIAL_PROJECT_STATE } from "./projectV2New.constants";
import ProjectNamespaceFormField from "../fields/ProjectNamespaceFormField";
import NameFormField from "../fields/NameFormField";
import ProjectSlugFormField from "../fields/ProjectSlugFormField";
import { slugFromTitle } from "../../../utils/helpers/HelperFunctions";
import ProjectNameFormField from "../fields/ProjectNameFormField";
import { ChevronDown } from "react-bootstrap-icons";
import ProjectVisibilityFormField from "../fields/ProjectVisibilityFormField";

function projectToProjectPost(
  project: NewProjectV2State["project"]
): ProjectPost {
  return {
    name: project.metadata.name,
    namespace: project.metadata.namespace,
    slug: project.metadata.slug,
    description: project.metadata.description,
    visibility: project.access.visibility,
    repositories: project.content.repositories
      .map((r) => r.url.trim())
      .filter((r) => r.length > 0),
  };
}

function ProjectV2NewAccessStepHeader() {
  return (
    <>
      <b>Set up visibility and access</b>
      <p>Decide who can see your project and who is allowed to work in it.</p>
    </>
  );
}

function ProjectV2NewHeader({
  currentStep,
}: Pick<NewProjectV2State, "currentStep">) {
  return (
    <>
      <p>
        V2 Projects let you group together related resources and control who can
        access them.
        <WipBadge className="ms-1" />
      </p>
      {currentStep === 0 && <ProjectV2NewMetadataStepHeader />}
      {currentStep === 1 && <ProjectV2NewAccessStepHeader />}
      {currentStep === 2 && <ProjectV2NewRepositoryStepHeader />}
      {currentStep === 3 && <ProjectV2NewProjectCreatingStepHeader />}
    </>
  );
}

function ProjectV2NewMetadataStepHeader() {
  return (
    <>
      <h4>Describe your project</h4>
      <p>Provide some information to explain what your project is about.</p>
    </>
  );
}

function ProjectV2NewProjectCreatingStepHeader() {
  return (
    <>
      <h4>Review and create</h4>
      <p>Review what has been entered and, if ready, create the project.</p>
    </>
  );
}

function ProjectV2NewRepositoryStepHeader() {
  return (
    <>
      <h4>Associate some repositories (optional)</h4>
      <p>
        You can associate one or more repositories with the project now if you
        want. This can also be done later at any time.
      </p>
    </>
  );
}

function ProjectV2NewReviewCreateStep({
  currentStep,
}: Pick<NewProjectV2State, "currentStep">) {
  const { project } = useAppSelector((state) => state.newProjectV2);
  const [createProject, result] = usePostProjectsMutation();
  const newProject = projectToProjectPost(project);
  const navigate = useNavigate();
  const onSubmit = useCallback(
    (e: FormEvent<HTMLElement>) => {
      e.preventDefault();
      createProject({ projectPost: newProject });
    },
    [createProject, newProject]
  );

  useEffect(() => {
    if (
      result.isSuccess &&
      project.metadata.namespace &&
      project.metadata.slug
    ) {
      const projectUrl = generatePath(ABSOLUTE_ROUTES.v2.projects.show.root, {
        namespace: project.metadata.namespace,
        slug: project.metadata.slug,
      });
      navigate(projectUrl);
    }
  }, [result, project, navigate]);

  const errorAlert = result.error && <RtkErrorAlert error={result.error} />;

  return (
    <Form noValidate onSubmit={onSubmit}>
      {errorAlert}
      <h4>Review</h4>
      <div>
        <Label>Name</Label>
        <p className="fw-bold">{newProject.name}</p>
        <Label>Namespace</Label>
        <p className="fw-bold">{newProject.namespace}</p>
        <Label>Slug</Label>
        <p className="fw-bold">{newProject.slug}</p>
        <Label>Visibility</Label>
        <p className="fw-bold">{newProject.visibility}</p>
      </div>
      <ProjectV2DescriptionAndRepositories project={newProject} />
      <ProjectFormSubmitGroup currentStep={currentStep} />
    </Form>
  );
}

export default function ProjectV2New() {
  const user = useLegacySelector((state) => state.stateModel.user);
  return (
    <>
      <h2 className="mb-3">Create a new project</h2>
      <p>
        A Renku project groups together data, code, and compute resources for
        you and your collaborators.
      </p>
      {user.logged ? (
        <ProjectV2CreationDetails />
      ) : (
        <LoginAlert
          logged={user.logged}
          textIntro="Only authenticated users can create new projects."
          textPost="to create a new project."
        />
      )}
    </>
  );
}

function ProjectV2CreationDetails() {
  const [isCollapseOpen, setIsCollapseOpen] = useState(false);
  const toggleCollapse = () => setIsCollapseOpen(!isCollapseOpen);

  const dispatch = useDispatch();
  const { project } = useAppSelector((state) => state.newProjectV2);
  const {
    control,
    formState: { errors, touchedFields },
    handleSubmit,
    getValues,
    setValue,
    watch,
  } = useForm<NewProjectForm>({
    mode: "onChange",
    defaultValues: INITIAL_PROJECT_STATE,
  });

  // const {
  //   control,
  //   formState: { errors, touchedFields },
  //   setValue,
  //   getValues,
  // } = useForm<DataConnectorMountForm>({
  //   mode: "onChange",
  //   defaultValues: {
  //     name: flatDataConnector.name || "",
  //     namespace: flatDataConnector.namespace || "",
  //     visibility: flatDataConnector.visibility || "private",
  //     slug: flatDataConnector.slug || "",
  //     mountPoint:
  //       flatDataConnector.mountPoint ||
  //       `${flatDataConnector.schema?.toLowerCase()}`,
  //     readOnly: flatDataConnector.readOnly ?? false,
  //     saveCredentials: cloudStorageState.saveCredentials,
  //   },
  // });

  // const onSubmit = useCallback(
  //   (data: NewProjectForm) => {
  //     // dispatch(setMetadata(data));
  //     console.log(data);
  //     // const nextStep = (currentStep + 1) as typeof currentStep;
  //     // dispatch(setCurrentStep(nextStep));
  //   },
  //   [dispatch]
  // );
  const onSubmit = useCallback((data: NewProjectForm) => {
    console.log(data);
  }, []);

  // We watch for changes in the name and derive the slug from it
  const currentName = watch("name");
  useEffect(() => {
    setValue("slug", slugFromTitle(currentName, true, true), {
      shouldValidate: true,
    });
  }, [currentName, setValue]);

  // Slug and namespace are use to show the projected URL
  const currentNamespace = watch("namespace");
  const currentSlug = watch("slug");

  const ownerHelpText = (
    <FormText className="input-hint">
      The URL for this project will be{" "}
      <span className="fw-bold">
        renkulab.io/v2/projects/{currentNamespace || "<Owner>"}/
        {currentSlug || "<Name>"}
      </span>
    </FormText>
  );

  const resetUrl = useCallback(() => {
    setValue("slug", slugFromTitle(currentName, true, true), {
      shouldValidate: true,
    });
  }, [setValue, currentName]);

  return (
    <>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3">
          <ProjectNameFormField control={control} errors={errors} name="name" />
        </div>

        <div className="mb-1">
          <ProjectNamespaceFormField
            control={control}
            entityName="project"
            errors={errors}
            helpText={ownerHelpText}
            name="namespace"
          />
        </div>

        <div className="mb-3">
          <button
            className={cx("btn", "btn-link", "p-0", "text-decoration-none")}
            onClick={toggleCollapse}
            type="button"
          >
            Customize project URL <ChevronDown className="bi" />
          </button>
          <Collapse isOpen={isCollapseOpen}>
            <div
              className={cx(
                "align-items-center",
                "d-flex",
                "flex-wrap",
                "mb-0"
              )}
            >
              <span>
                renkulab.io/v2/projects/{currentNamespace || "<Owner>"}/
              </span>
              <ProjectSlugFormField
                compact={true}
                control={control}
                errors={errors}
                name="slug"
              />
            </div>
          </Collapse>

          {errors.slug && touchedFields.slug && (
            <div className={cx("d-block", "invalid-feedback")}>
              <p className="mb-1">
                You can customize the slug only with lowercase letters, numbers,
                and hyphens.
              </p>

              {currentName ? (
                <Button color="danger" size="sm" onClick={resetUrl}>
                  Reset URL
                </Button>
              ) : (
                <p className="mb-0">
                  Mind the URL will be updated once you provide a name.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mb-3">
          <div className="mb-1">
            <ProjectVisibilityFormField
              name="visibility"
              control={control}
              errors={errors}
            />
          </div>
          <Label className="form-label" for="projectV2NewForm-users">
            You can add members after creating the project.
          </Label>
        </div>

        {/*
        <ProjectDescriptionFormField
          control={control}
          errors={errors}
          name="description"
        />
         */}
        {/* <ProjectFormSubmitGroup currentStep={0} /> */}

        <Button color="primary" type="submit">
          Create
        </Button>
      </Form>
    </>
  );
}
