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

import cx from "classnames";
import { Button, Input } from "reactstrap";
import { Project } from "../../../projectsV2/api/projectV2.api.ts";
import { useDeleteProjectsByProjectIdMutation } from "../../../projectsV2/api/projectV2.enhanced-api.ts";
import { useCallback, useContext, useEffect, useState } from "react";
import { Loader } from "../../../../components/Loader.tsx";
import { Trash } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom-v5-compat";
import { Url } from "../../../../utils/helpers/url";
import { NOTIFICATION_TOPICS } from "../../../../notifications/Notifications.constants.ts";
import AppContext from "../../../../utils/context/appContext.ts";
import { NotificationsManager } from "../../../../notifications/notifications.types.ts";

export function notificationProjectDeleted(
  notifications: NotificationsManager,
  projectName: string
) {
  notifications.addSuccess(
    NOTIFICATION_TOPICS.PROJECT_DELETED,
    <>
      Project <code>{projectName}</code> successfully deleted.
    </>
  );
}

interface ProjectDeleteProps {
  project: Project;
}
export default function ProjectPageDelete({ project }: ProjectDeleteProps) {
  const [deleteProject, result] = useDeleteProjectsByProjectIdMutation();
  const navigate = useNavigate();
  const { notifications } = useContext(AppContext);
  const onDelete = useCallback(() => {
    deleteProject({ projectId: project.id });
  }, [deleteProject, project.id]);

  useEffect(() => {
    if (result.isSuccess) {
      navigate(Url.get(Url.pages.projectV2.list));
      if (notifications)
        notificationProjectDeleted(notifications, project.name);
    }
  }, [result.isSuccess, navigate, notifications, project.name]);

  const [typedName, setTypedName] = useState("");
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTypedName(e.target.value.trim());
    },
    [setTypedName]
  );

  return (
    <>
      <div className={cx("pt-3")}>
        <h4 className="fw-bold">Delete project</h4>
        <small>
          Are you sure you want to delete this project?
          <br />
          Deleting the project will remove its repository, launcher sessions and
          data sources.
        </small>
        <div
          id={"general"}
          className={cx("bg-white", "rounded-3", "mt-3", "p-3", "p-md-4")}
        >
          <p className={cx("mb-0", "pb-3")}>
            Deleted projects cannot be restored. Please type{" "}
            <strong>{project.slug}</strong>, the slug of the project, to
            confirm.
          </p>
          <Input
            data-cy="delete-confirmation-input"
            value={typedName}
            onChange={onChange}
          />
          <div className="text-end">
            <Button
              className="ms-2 mt-5"
              color="danger"
              disabled={typedName !== project.slug?.trim()}
              onClick={onDelete}
            >
              {result.isLoading ? (
                <Loader className="me-1" inline size={16} />
              ) : (
                <Trash className={cx("bi", "me-1")} />
              )}
              Delete project
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
