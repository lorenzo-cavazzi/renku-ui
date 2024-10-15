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

import { SerializedError } from "@reduxjs/toolkit";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import cx from "classnames";
import { ArrowLeft } from "react-bootstrap-icons";
import { Link, useParams } from "react-router-dom-v5-compat";

import ContainerWrap from "../../../components/container/ContainerWrap";
import { RtkOrNotebooksError } from "../../../components/errors/RtkErrorAlert";
import { ABSOLUTE_ROUTES } from "../../../routing/routes.constants";
import rkNotFoundImgV2 from "../../../styles/assets/not-foundV2.svg";
import useLegacySelector from "../../../utils/customHooks/useLegacySelector.hook.ts";

interface UserNotFoundProps {
  error?: FetchBaseQueryError | SerializedError | undefined | null;
}

export default function UserNotFound({ error }: UserNotFoundProps) {
  const { username } = useParams<{ username: string }>();
  const logged = useLegacySelector((state) => state.stateModel.user.logged);

  const notFoundText = username ? (
    <>
      We could not find the user{" "}
      <span className={cx("fw-bold", "user-select-all")}>{username}</span>.
    </>
  ) : (
    <>We could not find the requested user.</>
  );

  return (
    <ContainerWrap>
      <div className={cx("d-flex")}>
        <div className={cx("m-auto", "d-flex", "flex-column")}>
          <h3
            className={cx(
              "text-primary",
              "fw-bold",
              "my-0",
              "d-flex",
              "align-items-center",
              "gap-3"
            )}
          >
            <img src={rkNotFoundImgV2} />
            User not found
          </h3>
          <div className={cx("text-start", "mt-3")}>
            <p>{notFoundText}</p>
            <p>It is possible that the user has been deleted.</p>
            {error && <RtkOrNotebooksError error={error} dismissible={false} />}
            <Link
              to={ABSOLUTE_ROUTES.v2.root}
              className={cx("btn", "btn-primary")}
            >
              <ArrowLeft className={cx("me-2", "text-icon")} />
              {logged ? "Return to the dashboard" : "Return to home page"}
            </Link>
          </div>
        </div>
      </div>
    </ContainerWrap>
  );
}
