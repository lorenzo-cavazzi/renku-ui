/*!
 * Copyright 2018 - Swiss Data Science Center (SDSC)
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

import React, { Component } from "react";
import { Link, Route, Switch } from "react-router-dom";
import { Row, Col, Alert } from "reactstrap";
import { Button, Form, InputGroup, FormText, Input, Label, ButtonGroup } from "reactstrap";
import { Nav, NavItem, InputGroupButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap";

import { ProjectAvatar, Loader, Pagination, TimeCaption, RenkuNavLink } from "../../utils/UIComponents";
import { ProjectTagList } from "../shared";
import { faCheck, faSortAmountDown, faSortAmountUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "../Project.css";

class ProjectListRow extends Component {
  render() {
    const MAX_DESCRIPTION_LENGTH = 250;
    const projectsUrl = this.props.projectsUrl;
    const title =
      <Link to={`${projectsUrl}/${this.props.path_with_namespace}`}>
        {this.props.path_with_namespace || "no title"}
      </Link>;
    let description = (this.props.description !== "" && this.props.description !== null) ?
      this.props.description :
      "No description available";
    if (description.length > MAX_DESCRIPTION_LENGTH)
      description = description.slice(0, MAX_DESCRIPTION_LENGTH) + "...";

    return (
      <div className="d-flex project-list-row mb-3">
        <div className="mr-2">
          <ProjectAvatar owner={this.props.owner} avatar_url={this.props.avatar_url} namespace={this.props.namespace}
            getAvatarFromNamespace={this.props.getAvatarFromNamespace} />
        </div>
        <div>
          <p className="mb-1">
            <b>{title}</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<ProjectTagList taglist={this.props.tag_list} />
          </p>
          <span>{description} <TimeCaption caption="Updated" time={this.props.last_activity_at} /></span>
        </div>
      </div>
    );
  }
}

class ProjectSearchForm extends Component {

  render() {
    return [<Form key="form" onSubmit={this.props.handlers.onSearchSubmit} inline>
      <InputGroup>
        <Input name="searchQuery" id="searchQuery" placeholder={this.props.searchText} style={{ minWidth: "300px" }}
          value={this.props.searchQuery} onChange={this.props.handlers.onSearchQueryChange}
          className="border-primary" />
        <Label for="searchQuery" hidden>Query</Label>
        {
          this.props.urlMap.projectsSearchUrl === this.props.currentTab || this.props.hasUser === false ?
            <InputGroupButtonDropdown addonType="append"
              toggle={this.props.handlers.onSearchInDropdownToogle} isOpen={this.props.searchInDropdownOpen} >
              <DropdownToggle outline caret color="primary" >
                Filter by: {this.props.searchInLabel}
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem value={this.props.searchInValuesMap.PROJECTNAME}
                  onClick={this.props.handlers.changeSearchDropdownFilter}>
                  {this.props.searchIn === this.props.searchInValuesMap.PROJECTNAME ?
                    <FontAwesomeIcon icon={faCheck} /> : null} Project Name
                </DropdownItem>
                <DropdownItem key={this.props.searchInValuesMap.USERNAME}
                  value={this.props.searchInValuesMap.USERNAME}
                  onClick={this.props.handlers.changeSearchDropdownFilter}>
                  {this.props.searchIn === this.props.searchInValuesMap.USERNAME ?
                    <FontAwesomeIcon icon={faCheck} /> : null} User Name
                </DropdownItem>
                <DropdownItem key={this.props.searchInValuesMap.GROUPNAME}
                  value={this.props.searchInValuesMap.GROUPNAME}
                  onClick={this.props.handlers.changeSearchDropdownFilter}>
                  {this.props.searchIn === this.props.searchInValuesMap.GROUPNAME ?
                    <FontAwesomeIcon icon={faCheck} /> : null} Group Name
                </DropdownItem>
              </DropdownMenu>
            </InputGroupButtonDropdown>
            : null
        }
        <InputGroupButtonDropdown addonType="append"
          toggle={this.props.handlers.onOrderByDropdownToogle} isOpen={this.props.orderByDropdownOpen} >
          <Button outline color="primary" onClick={this.props.handlers.toogleSearchSorting}>
            {this.props.orderSearchAsc ?
              <FontAwesomeIcon icon={faSortAmountUp} /> :
              <FontAwesomeIcon icon={faSortAmountDown} />}
          </Button>
          <DropdownToggle outline caret color="primary" >
            Order by: {this.props.orderByLabel}
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem value={this.props.orderByValuesMap.NAME}
              onClick={this.props.handlers.changeSearchDropdownOrder}>
              {this.props.orderBy === this.props.orderByValuesMap.NAME ?
                <FontAwesomeIcon icon={faCheck} /> :
                null} Name
            </DropdownItem>
            <DropdownItem value={this.props.orderByValuesMap.CREATIONDATE}
              onClick={this.props.handlers.changeSearchDropdownOrder}>
              {this.props.orderBy === this.props.orderByValuesMap.CREATIONDATE ?
                <FontAwesomeIcon icon={faCheck} /> :
                null} Creation Date
            </DropdownItem>
            <DropdownItem value={this.props.orderByValuesMap.UPDATEDDATE}
              onClick={this.props.handlers.changeSearchDropdownOrder}>
              {this.props.orderBy === this.props.orderByValuesMap.UPDATEDDATE ?
                <FontAwesomeIcon icon={faCheck} /> :
                null} Updated Date
            </DropdownItem>
          </DropdownMenu>
        </InputGroupButtonDropdown>
      </InputGroup>
      &nbsp;
      <Button color="primary" onClick={this.props.handlers.onSearchSubmit}>
        Filter
      </Button>
    </Form>,
    this.props.searchIn === this.props.searchInValuesMap.PROJECTNAME ?
      <FormText key="help" color="muted">Leave emtpy to browse all projects.</FormText>
      : null
    ];
  }
}

class ProjectNavTabs extends Component {
  render() {
    return (
      <Row key="nav">
        <Col md={12}>
          {
            (this.props.loggedIn) ?
              [
                <div key="top-space">&nbsp;</div>,
                <Nav key="nav" pills className={"nav-pills-underline"}>
                  <NavItem>
                    <RenkuNavLink to={this.props.urlMap.projectsUrl}
                      alternate={this.props.urlMap.yourProjects} title="Your Projects" />
                  </NavItem>
                  <NavItem>
                    <RenkuNavLink exact={false} to={this.props.urlMap.starred} title="Starred Projects" />
                  </NavItem>
                  <NavItem>
                    <RenkuNavLink exact={false} to={this.props.urlMap.projectsSearchUrl} title="All Projects" />
                  </NavItem>
                </Nav>,
                <div key="bottom-space">&nbsp;</div>]
              :
              <span></span>
          }
        </Col>
      </Row>
    );
  }
}


class DisplayEmptyProjects extends Component {
  render() {
    return (
      <Col>
        <p>
          <strong>{this.props.emptyListText}</strong><br />
          If there is a project you work on or want to follow, you should search for it in
          the <Link to={this.props.projectsSearchUrl}>project search</Link>, click on it to view it, and star it.
        </p>
        <p>
          Alternatively, you can <Link to={this.props.projectNewUrl}>create a new project</Link>.
        </p>
      </Col>
    );
  }
}

class ProjectsRows extends Component {
  render() {
    if (this.props.forbidden) return <Col>You need to be logged in to search projects per user name.</Col>;

    if (this.props.loading) return <Col md={{ size: 2, offset: 3 }}><Loader /></Col>;

    if (this.props.page.emptyResponseMessage) {
      return <DisplayEmptyProjects
        projectsSearchUrl={this.props.urlMap.projectsSearchUrl}
        projectNewUrl={this.props.urlMap.projectNewUrl}
        emptyListText={this.props.emptyListText} />;
    }

    const projects = this.props.page.projects || [];
    const rows = projects.map((p) =>
      <ProjectListRow
        key={p.id}
        projectsUrl={this.props.urlMap.projectsUrl}
        {...p}
        getAvatarFromNamespace={this.props.getAvatarFromNamespace} />);
    return <Col md={8}>{rows}</Col>;
  }
}

class UsersRow extends Component {
  render() {
    if (this.props.forbidden) return null;
    const usersOrGroupsList = this.props.usersOrGroupsList || [];
    const usersRows = usersOrGroupsList.map((p) => {
      if (this.props.searchIn === this.props.searchInValuesMap.USERNAME) {
        return <Button key={p.id} color="primary" outline
          onClick={() => this.props.handlers.changeSelectedUserOrGroup(p.id)}
          active={Number(this.props.selectedUserOrGroup) === Number(p.id)}>{p.username}
        </Button>;
      }
      else if (this.props.searchIn === this.props.searchInValuesMap.GROUPNAME) {
        return <Button key={p.id} color="primary" outline
          onClick={() => this.props.handlers.changeSelectedUserOrGroup(p.id)}
          active={Number(this.props.selectedUserOrGroup) === Number(p.id)}>{p.full_path}
        </Button>;
      }
      return null;
    });
    return (this.props.loading) ?
      <Col></Col> :
      <Col md={12}>
        <ButtonGroup className="d-block" size="sm">{usersRows}</ButtonGroup>
      </Col>;
  }
}

class ProjectsSearch extends Component {
  render() {
    const loading = this.props.loading || false;
    const hasUser = this.props.user.logged;
    const forbidden = this.props.searchIn === this.props.searchInValuesMap.USERNAME && !hasUser;
    return [
      <Row key="form">
        {
          (this.props.loggedOutMessage !== undefined) ?
            <Col md={8} ><span>{this.props.loggedOutMessage}</span><br /><br /></Col>
            :
            <span></span>
        }
        <Col md={12}>
          <ProjectSearchForm
            orderByValuesMap={this.props.orderByValuesMap}
            searchInValuesMap={this.props.searchInValuesMap}
            orderBy={this.props.orderBy}
            searchIn={this.props.searchIn}
            usersOrGroupsList={this.props.usersOrGroupsList}
            selectedUserOrGroup={this.props.selectedUserOrGroup}
            setSelectedUserOrGroup={this.props.setSelectedUserOrGroup}
            searchText={this.props.searchText}
            orderByLabel={this.props.orderByLabel}
            searchInLabel={this.props.searchInLabel}
            orderByDropdownOpen={this.props.orderByDropdownOpen}
            searchInDropdownOpen={this.props.searchInDropdownOpen}
            orderSearchAsc={this.props.orderSearchAsc}
            searchQuery={this.props.searchQuery}
            handlers={this.props.handlers}
            currentTab={this.props.currentTab}
            urlMap={this.props.urlMap}
            hasUser={hasUser} />
        </Col>
      </Row>,
      <Row key="spacer2">
        <Col md={8}>&nbsp;</Col>
      </Row>,
      this.props.searchIn === this.props.searchInValuesMap.USERNAME ||
      this.props.searchIn === this.props.searchInValuesMap.GROUPNAME ?
        <Row key="users">
          <UsersRow
            usersOrGroupsList={this.props.usersOrGroupsList}
            handlers={this.props.handlers}
            searchIn={this.props.searchIn}
            searchInValuesMap={this.props.searchInValuesMap}
            selectedUserOrGroup={this.props.selectedUserOrGroup}
            loading={loading}
            forbidden={forbidden}
          />
        </Row> :
        null,
      <Row key="spacer3"><Col md={8}>&nbsp;</Col></Row>,
      <Row key="projects">
        <ProjectsRows
          page={this.props.page}
          urlMap={this.props.urlMap}
          loading={loading}
          forbidden={forbidden}
          emptyListText={this.props.emptyListText}
          getAvatarFromNamespace={this.props.handlers.getAvatarFromNamespace}
        />
      </Row>,
      <Pagination key="pagination" {...this.props} />
    ];
  }
}

class NotFoundInsideProject extends Component {
  render() {
    return <Col key="nofound">
      <Row>
        <Col xs={12} md={12}>
          <Alert color="primary">
            <h4>404 - Page not found</h4>
            The URL
            <strong> {this.props.location.pathname.replace(this.props.match.url, "")} </strong>
            is not a subpath of <strong>/projects</strong>. You can navigate
            through renku projects using the tabs on top.
          </Alert>
        </Col>
      </Row>
    </Col>;
  }
}

class ProjectList extends Component {
  render() {
    if (!this.props.user.fetched)
      return null;
    const hasUser = this.props.user.logged;
    const urlMap = this.props.urlMap;
    let emptyListText = "You are logged in, but you have not yet starred any projects. Starring a ";
    emptyListText += "project declares your interest in it. ";

    return [
      <Row key="header">
        <Col md={3} lg={2}><h1>Projects</h1></Col>
        <Col md={2}>
          {
            (hasUser) ?
              <Link className="btn btn-primary" role="button" to={urlMap.projectNewUrl}>New Project</Link> :
              <span></span>
          }
        </Col>
      </Row>,
      <ProjectNavTabs loggedIn={hasUser} key="navbar" urlMap={urlMap} />,
      <Row key="content">
        <Col key="" md={12}>
          {
            (hasUser) ?
              <Switch>
                <Route path={urlMap.starred}
                  render={props => <ProjectsSearch
                    emptyListText={emptyListText}
                    {...this.props} />} />
                <Route path={urlMap.projectsSearchUrl}
                  render={props => <ProjectsSearch {...this.props} />} />
                <Route path={urlMap.yourProjects}
                  render={props => <ProjectsSearch {...this.props}
                    emptyListText="You are logged in, but you have not yet created any projects. " />} />
                <Route path={urlMap.projectsUrl}
                  render={props => <ProjectsSearch {...this.props}
                    emptyListText="You are logged in, but you have not yet created any projects. " />} />
                <Route component={NotFoundInsideProject} />
              </Switch>
              :
              <Switch>
                <Route path={urlMap.starred}
                  // eslint-disable-next-line max-len
                  render={props => <ProjectsSearch loggedOutMessage="You need to be logged in to be able to see a list with the projects you starred, therefore we will display all projects for you to explore." {...this.props} />} />
                <Route path={urlMap.projectsSearchUrl}
                  render={props => <ProjectsSearch {...this.props} />} />
                <Route path={urlMap.yourProjects}
                  // eslint-disable-next-line max-len
                  render={props => <ProjectsSearch loggedOutMessage="You need to be logged in to be able to see a list with your own projects, therefore we will display all projects for you to explore." {...this.props} />} />
                <Route exact path={urlMap.projectsUrl}
                  render={props => <ProjectsSearch {...this.props} />} />
                <Route component={NotFoundInsideProject} />
              </Switch>
          }
        </Col>
      </Row>
    ];
  }
}

export default ProjectList;
export { ProjectListRow };
