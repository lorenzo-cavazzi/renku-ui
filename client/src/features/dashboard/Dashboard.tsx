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

import LoginAlert from "../../components/loginAlert/LoginAlert";
import { SshModal } from "../../components/ssh/ssh";
import useLegacySelector from "../../utils/customHooks/useLegacySelector.hook";
import DashboardMessage from "./components/DashboardMessage";
import { DatasetDashboard } from "./components/DatasetsDashboard";
import ProjectsInactiveKGWarning from "./components/InactiveKgProjects";
import { ProjectsDashboard } from "./components/ProjectsDashboard";

import "./Dashboard.scss";

function LoggedOutDashboard() {
  return (
    <div className="rk-dashboard">
      <DashboardMessage />
      <div className="mt-5">
        <LoginAlert
          logged={false}
          textPost="to view the Renku legacy dashboard."
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const user = useLegacySelector((state) => state.stateModel.user);

  if (user == null || user.data == null || user.data.name == null)
    return <LoggedOutDashboard />;

  return (
    <div className="rk-dashboard">
      <h1 data-cy="dashboard-title">Renku Dashboard - {user.data.name}</h1>
      <DashboardMessage />
      <ProjectsInactiveKGWarning />
      <ProjectsDashboard />
      <DatasetDashboard />
      <SshModal />
    </div>
  );
}
