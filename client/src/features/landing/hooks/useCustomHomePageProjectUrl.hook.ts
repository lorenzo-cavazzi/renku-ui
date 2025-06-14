/*!
 * Copyright 2025 - Swiss Data Science Center (SDSC)
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

import { useContext } from "react";
import { generatePath } from "react-router";

import { ABSOLUTE_ROUTES } from "../../../routing/routes.constants";
import AppContext from "../../../utils/context/appContext";
import { DEFAULT_APP_PARAMS } from "../../../utils/context/appParams.constants";

export function useCustomHomePageProjectUrl(): string {
  const { params } = useContext(AppContext);
  const homePage = params?.["HOMEPAGE"] ?? DEFAULT_APP_PARAMS.HOMEPAGE;
  if (!homePage || !homePage.projectPath)
    return generatePath(ABSOLUTE_ROUTES.v2.root);
  const [namespace, slug] = homePage.projectPath.split("/");
  if (!namespace || !slug) return generatePath(ABSOLUTE_ROUTES.v2.root);
  return generatePath(ABSOLUTE_ROUTES.v2.projects.show.root, {
    namespace,
    slug,
  });
}
