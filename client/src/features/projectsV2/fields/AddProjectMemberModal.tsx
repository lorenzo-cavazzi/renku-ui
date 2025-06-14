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
import { useCallback, useEffect } from "react";
import { PersonGear, PlusLg, XLg } from "react-bootstrap-icons";
import { Controller, useForm } from "react-hook-form";
import { SingleValue } from "react-select";
import {
  Button,
  Form,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "reactstrap";
import { RtkOrNotebooksError } from "../../../components/errors/RtkErrorAlert";
import type { User } from "../../searchV2/api/searchV2Api.api";
import type {
  ProjectMemberPatchRequest,
  ProjectMemberResponse,
} from "../api/projectV2.api";
import { usePatchProjectsByProjectIdMembersMutation } from "../api/projectV2.enhanced-api";
import { UserControl } from "./UserSelector";

interface AddProjectMemberModalProps {
  isOpen: boolean;
  members: ProjectMemberPatchRequest[];
  projectId: string;
  toggle: () => void;
}

interface ProjectMemberForAdd extends ProjectMemberResponse {}

interface AddProjectMemberAccessFormProps
  extends Pick<AddProjectMemberModalProps, "members" | "projectId" | "toggle"> {
  user?: User;
}
function AddProjectMemberAccessForm({
  members,
  projectId,
  toggle,
}: AddProjectMemberAccessFormProps) {
  const [patchProjectMembers, result] =
    usePatchProjectsByProjectIdMembersMutation();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectMemberForAdd>({
    defaultValues: {
      id: "",
      role: "viewer",
    },
  });

  useEffect(() => {
    if (!result.isSuccess) {
      return;
    }
    toggle();
  }, [result.isSuccess, toggle]);

  const onSubmit = useCallback(
    (data: ProjectMemberForAdd) => {
      const projectMembers = members.map((m: ProjectMemberResponse) => ({
        id: m.id,
        role: m.role,
      }));
      projectMembers.push({ id: data.id, role: data.role });

      patchProjectMembers({
        projectId,
        projectMemberListPatchRequest: projectMembers,
      });
    },
    [patchProjectMembers, projectId, members]
  );

  return (
    <>
      <ModalBody>
        <Form
          className="form-rk-green"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          {result.error && <RtkOrNotebooksError error={result.error} />}
          <div className="mb-3">
            <Label className="form-label" for="addProjectMember">
              User
            </Label>
            <Controller
              control={control}
              name="id"
              render={({ field }) => {
                return (
                  <UserControl
                    {...field}
                    className={cx(errors.id && "is-invalid")}
                    data-cy="add-project-member"
                    id="addProjectMember"
                    onChange={(newValue: SingleValue<User>) =>
                      field.onChange(newValue?.id)
                    }
                  />
                );
              }}
              rules={{ required: true }}
            />
            <div className="invalid-feedback">Please select a user to add</div>
          </div>
          <div className={cx("align-items-baseline", "d-flex", "flex-row")}>
            <Label for="member-role">Role</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Input
                  className={cx("form-control", "ms-3")}
                  data-cy="member-role"
                  id="member-role"
                  type="select"
                  style={{ maxWidth: "7em" }}
                  {...field}
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="owner">Owner</option>
                </Input>
              )}
              rules={{ required: true }}
            />
          </div>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button color="outline-primary" onClick={toggle}>
          <XLg className={cx("bi", "me-1")} />
          Close
        </Button>
        <Button color="primary" onClick={handleSubmit(onSubmit)} type="submit">
          <PlusLg className={cx("bi", "me-1")} />
          Add Member
        </Button>
      </ModalFooter>
    </>
  );
}

export default function AddProjectMemberModal({
  isOpen,
  members,
  projectId,
  toggle,
}: AddProjectMemberModalProps) {
  return (
    <Modal
      backdrop="static"
      centered
      fullscreen="lg"
      isOpen={isOpen}
      size="lg"
      toggle={toggle}
    >
      <ModalHeader toggle={toggle}>
        <PersonGear className={cx("me-1", "bi")} />
        Add a project member
      </ModalHeader>
      <AddProjectMemberAccessForm
        members={members}
        projectId={projectId}
        toggle={toggle}
      />
    </Modal>
  );
}
