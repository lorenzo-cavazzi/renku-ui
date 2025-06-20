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
import { useCallback, useContext, useState } from "react";
import { List, Search } from "react-bootstrap-icons";
import { Link } from "react-router";
import {
  Badge,
  Collapse,
  Nav,
  NavItem,
  Navbar,
  NavbarToggler,
} from "reactstrap";
import StatusBanner from "../../features/platform/components/StatusBanner";
import SunsetV1Button from "../../features/projectsV2/shared/SunsetV1Button";
import { NavBarWarnings } from "../../features/landing/components/NavBar/NavBarWarnings";
import { ABSOLUTE_ROUTES } from "../../routing/routes.constants";
import AppContext from "../../utils/context/appContext";
import RenkuNavLinkV2 from "../RenkuNavLinkV2";
import AnnounceV2Banner from "./AnnounceV2Banner";
import {
  RenkuToolbarGitLabMenu,
  RenkuToolbarHelpMenu,
  RenkuToolbarItemPlus,
  RenkuToolbarItemUser,
  RenkuToolbarNotifications,
} from "./NavBarItems";
import { RENKU_LOGO } from "./navbar.constants";

export default function LoggedInNavBar() {
  const { params, model, notifications } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);
  const onToggle = useCallback(() => {
    setIsOpen((isOpen) => !isOpen);
  }, []);
  if (!params) return null;
  const uiShortSha = params?.UI_SHORT_SHA;

  return (
    <>
      <header className="navbar navbar-expand-lg navbar-dark rk-navbar p-0">
        <Navbar
          color="primary"
          className="container-fluid flex-wrap flex-lg-nowrap renku-container"
        >
          <Link
            id="link-home"
            data-cy="link-home"
            to={ABSOLUTE_ROUTES.v1.root}
            className="navbar-brand me-2 pb-0 pt-0"
          >
            <img
              src={RENKU_LOGO}
              alt="Renku Legacy"
              height="50"
              className="d-block"
            />
          </Link>
          <Badge color="warning" className="mx-2">
            Legacy
          </Badge>
          <SunsetV1Button outline />
          <NavbarToggler onClick={onToggle} className="border-0">
            <List className="bi text-rk-white" />
          </NavbarToggler>
          <Collapse isOpen={isOpen} navbar className="">
            <Nav
              className={cx(
                "navbar-nav",
                "flex-row",
                "flex-wrap",
                "flex-sm-nowrap",
                "align-items-center",
                "ms-lg-auto"
              )}
            >
              <NavItem className="nav-item col-12 col-sm-4 col-lg-auto pe-lg-4">
                <RenkuNavLinkV2
                  className={cx("d-flex", "gap-2", "align-items-center")}
                  id="link-search"
                  to={ABSOLUTE_ROUTES.v1.search}
                >
                  <Search />
                  Search
                </RenkuNavLinkV2>
              </NavItem>
              <NavItem
                id="link-dashboard"
                data-cy="link-dashboard"
                className="nav-item col-12 col-sm-4 col-lg-auto pe-lg-4"
              >
                <RenkuNavLinkV2
                  id="link-dashboard"
                  to={ABSOLUTE_ROUTES.v1.root}
                >
                  Dashboard
                </RenkuNavLinkV2>
              </NavItem>
              <NavItem className="nav-item col-auto ms-sm-auto">
                <RenkuToolbarItemPlus />
              </NavItem>
              <NavItem className="nav-item col-auto">
                <RenkuToolbarGitLabMenu />
              </NavItem>
              <NavItem className="nav-item col-auto">
                <RenkuToolbarHelpMenu />
              </NavItem>
              <NavItem className="nav-item col-auto">
                <RenkuToolbarNotifications
                  model={model}
                  notifications={notifications}
                />
              </NavItem>
              <NavItem className="nav-item col-auto">
                <RenkuToolbarItemUser params={params} />
              </NavItem>
            </Nav>
          </Collapse>
        </Navbar>
      </header>
      <AnnounceV2Banner />
      <StatusBanner params={params} />
      <NavBarWarnings model={model} uiShortSha={uiShortSha} />
    </>
  );
}
