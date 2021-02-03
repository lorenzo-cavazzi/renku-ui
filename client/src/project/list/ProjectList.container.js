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

import React, { Component, useState, useEffect, } from "react";
import { useParams, useLocation } from "react-router-dom";

import { connect } from "react-redux";
import qs from "query-string";

import ProjectListPresent, { ProjectListNew } from "./ProjectList.present";
import ProjectListModel from "./ProjectList.state";
import { Loader } from "../../utils/UIComponents";
import { Url, getSearchParams } from "../../utils/url";

const orderByValuesMap = {
  NAME: "name",
  CREATIONDATE: "created_at",
  UPDATEDDATE: "last_activity_at"
};

const searchInValuesMap = {
  PROJECTNAME: "projects",
  USERNAME: "users",
  GROUPNAME: "groups"
};

const searchScopesValuesMap = {
  MEMBERSHIP: "membership",
  STARRED: "starred"
};

const SECTIONS = {
  own: "own",
  starred: "starred",
  all: "all",
};

const searchInMap = {
  projects: { value: "projects", text: "Project" },
  users: { value: "users", text: "User" },
  groups: { value: "groups", text: "Group" }
};

const orderByMap = {
  name: { value: "name", text: "Name" },
  creationDate: { value: "created_at", text: "Creation date" },
  updateDate: { value: "last_activity_at", text: "Update date" }
};

const PROJECT_NEW_URL = Url.get(Url.pages.project.new);

const urlMap = {
  projectsUrl: Url.get(Url.pages.projects), // TODO: remove?
  projectsSearchUrl: Url.get(Url.pages.projects.all), // --> all --> /all
  projectNewUrl: Url.get(Url.pages.project.new),
  starred: Url.get(Url.pages.projects.starred), // --> starred --> /starred
  yourProjects: Url.get(Url.pages.projects) // --> your --> null
};


const DEFAULT_PARAMS = {
  query: "",
  page: 1,
  perPage: 6, // TODO: change to 10
  searchIn: searchInMap.projects.value,
  orderBy: orderByMap.updateDate.value,
  ascending: false,
};
const CONVERSIONS = {
  q: "query", currentTab: "section", currentPage: "page", orderSearchAsc: "ascending", usersOrGroup: "targetUser"
};
const DEFAULT_PROJECTS = { fetched: null, fetching: null, total: null, pages: null, list: [] };
const DEFAULT_USERS_GROUPS = { fetched: null, fetching: null, list: [] };

/**
 * Return section based on current location.
 *
 * @param {object} location - React location object.
 * @returns {string} current section, as defined in the enum SECTIONS.
 */
function getSection(location) {
  let section = SECTIONS.own;
  if (location && location.pathname) {
    if (location.pathname.endsWith("/starred"))
      section = SECTIONS.starred;
    else if (location.pathname.endsWith("/all"))
      section = SECTIONS.all;
  }
  return section;
}

/**
 * Return full URL based on target section and current parameter
 *
 * @param {string} target - target section
 * @param {object} params - parameters object
 */
function buildPreciseUrl(target, params) {
  let page = Url.pages.projects.all;
  if (target === SECTIONS.own)
    page = Url.pages.projects.base;
  else if (target === SECTIONS.starred)
    page = Url.pages.projects.starred;

  // remove parameters we don't want to propagate
  // let finalParams = { ...params };
  // if (finalParams.section)
  //   delete finalParams.section;
  // if (target !== SECTIONS.all && finalParams.searchIn)
  //   delete finalParams.searchIn;

  const url = Url.get(page, params);
  return url;
}

/**
 * Show list of projects, allowing advanced search.
 *
 * @param {object} props.location - React location object.
 * @param {object} props.history - React history object.
 * @param {object} props.client - client object.
 * @param {object} props.user - user object.
 */
function ProjectList(props) {
  // Redirect anonymous users when trying to perform an invalid search (manually modified link)
  // const initSection = getSection(props.location);
  // const initSearch = getSearchParams();
  if (!props.user.logged) {
    const section = getSection(props.location);
    const searchParams = getSearchParams();
    // Searching in own or starred projects
    if (section !== SECTIONS.all) {
      const newUrl = Url.get(Url.pages.projects.all, searchParams);
      props.history.push(newUrl);
    }
    // filtering per user or group
    if (searchParams.searchIn !== searchInMap.projects.value) {
      const newParams = { ...searchParams, searchIn: searchInMap.projects.value };
      const newUrl = Url.get(Url.pages.projects.all, newParams);
      props.history.push(newUrl);
    }
  }

  // Initial setup
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [users, setUsers] = useState(DEFAULT_USERS_GROUPS);
  const [targetUser, setTargetUser] = useState(null);
  const [params, setParams] = useState({
    ...(getSearchParams(DEFAULT_PARAMS, CONVERSIONS)),
    section: getSection(props.location),
  });

  // Monitor location changes and set params
  useEffect(() => {
    console.log("Set params - global");
    const newSection = getSection(props.location);
    let newSearchParams = getSearchParams(null, CONVERSIONS);
    // prevent illegal searchIn
    if (newSection !== SECTIONS.all && newSearchParams.searchIn !== searchInMap.projects.value)
      newSearchParams.searchIn = searchInMap.projects.value;
    // console.log({ params, ...newSearchParams, section: newSection })
    // if (newSearchParams.search != null && typeof newSearchParams.search !== "string")
    //   newSearchParams.search = newSearchParams.search.toString();
    setParams(p => ({ ...p, ...newSearchParams, section: newSection }));
  }, [props.location]);

  // Get new users when params change (searchIn --> user or groups)
  useEffect(() => {
    if (params.searchIn === searchInMap.projects.value)
      return;
    console.log("Get users - user+groups");

    // Never fetch when filtering for something shorter than 3 chars
    if (params.query == null || !params.query.toString().length || params.query.toString().length < 3) {
      setUsers({ ...DEFAULT_USERS_GROUPS, fetching: false, fetched: new Date() });
      return;
    }

    // prepare fetching users
    setUsers(u => ({ ...u, fetched: null, fetching: true }));
    let queryParams = { search: params.query, per_page: 100 };

    // fetch users when feasible
    props.client.searchUsersOrGroups(queryParams, params.searchIn).then((response) => {
      const data = response.data ?
        response.data :
        response;

      // Set new target -- mind that targetUser is not currently used
      let target = params.targetUser ?
        params.targetUser :
        null;
      if (!target && data && data.length) {
        target = data[0].full_path ?
          encodeURIComponent(data[0].full_path) :
          data[0].username;
      }
      setTargetUser(target);

      // set users at the end to prevent flickering
      setUsers({
        fetching: false,
        fetched: new Date(),
        list: data,
      });
    });

  }, [params.targetUser, params.query, params.searchIn, props.client]);

  // Get new projects when params change (searchIn --> projects)
  useEffect(() => {
    if (params.searchIn !== searchInMap.projects.value)
      return;

    console.log("Get projects - projects");

    // prepare fetching projects
    setProjects(p => ({ ...p, fetched: null, fetching: true }));
    let queryParams = {
      search: params.query,
      page: params.page,
      per_page: params.perPage,
      order_by: params.orderBy,
      sort: params.ascending ? "asc" : "desc",
    };
    if (params.section === SECTIONS.own)
      queryParams.membership = true;
    else if (params.section === SECTIONS.starred)
      queryParams.starred = true;

    // fetch projects when feasible
    // // if (props.user.logged || (!props.user.logged && params.section === SECTIONS.all)) {
    props.client.getProjects(queryParams).then((response) => {
      setProjects({
        fetching: false,
        fetched: new Date(),
        total: response.pagination.totalItems,
        pages: response.pagination.totalPages,
        list: response.data,
      });
    });
    // //}
  }, [params, props.client]);

  // Get new projects when targetUser change (searchIn --> user or groups)
  useEffect(() => {
    if (params.searchIn === searchInMap.projects.value)
      return;

    console.log("Get projects - user+groups");

    // If no users were found, we already know there won't be any project.
    if (!targetUser) {
      setProjects({
        ...DEFAULT_PROJECTS,
        fetching: false,
        fetched: new Date(),
      });
      return;
    }

    // Prepare fetching user or group projects
    setProjects(p => ({ ...p, fetched: null, fetching: true }));
    let queryParams = {
      page: params.page,
      per_page: params.perPage,
      order_by: params.orderBy,
      sort: params.ascending ? "asc" : "desc",
    };
    // Fetch user or group projects
    props.client.getProjectsBy(params.searchIn, targetUser, queryParams)
      .then((response) => {
        setProjects({
          fetching: false,
          fetched: new Date(),
          total: response.pagination.totalItems,
          pages: response.pagination.totalPages,
          list: response.data,
        });
      });
  }, [props.client, params.searchIn, params.page, params.perPage, params.orderBy, params.ascending, targetUser]);

  // Programmatically set the selected user or group
  const setTarget = (target) => {
    if (target === targetUser)
      return;
    console.log("setTarget", target);
    setTargetUser(target);
  };

  // Programmatically move to page with proper query params to perform a new query
  const search = (newParams, section) => {
    // Get all the current params that are not default (apart from section that is not a query param).
    let modifiedParams = {};
    for (let [param, value] of Object.entries(params)) {
      if (param !== "section" && value !== DEFAULT_PARAMS[param])
        modifiedParams[param] = value;
    }

    // Use the section to decide the target URL since that is not a query param.
    const targetSection = section ?
      section :
      params.section;
    let target = Url.pages.projects.all;
    if (targetSection === SECTIONS.own)
      target = Url.pages.projects.base;
    else if (targetSection === SECTIONS.starred)
      target = Url.pages.projects.starred;

    // Fix illegal searchIn
    if (targetSection !== SECTIONS.all && modifiedParams.searchIn !== searchInMap.projects.value)
      modifiedParams.searchIn = searchInMap.projects.value;
    //   const newUrl = Url.get(Url.pages.projects.all, newParams);
    //   props.history.push(newUrl);
    // }

    // Move to the target url.
    let finalParams = { ...modifiedParams, ...(newParams || {}) };
    // if (finalParams.search != null && typeof finalParams.search !== "string")
    //   finalParams.search = finalParams.search.toString();
    const url = Url.get(target, finalParams);
    console.log(finalParams, url)
    props.history.push(url);
  };
  // if (!props.user.logged && getSection(props.location) !== SECTIONS.all) {
  //   const newUrl = Url.get(Url.pages.projects.all, getSearchParams());
  //   props.history.push(newUrl);
  // }

  const getPreciseUrl = (section) => {
    let modifiedParams = {};
    for (let [param, value] of Object.entries(params)) {
      if (param !== "section" && value !== DEFAULT_PARAMS[param])
        modifiedParams[param] = value;
    }
    if (section !== SECTIONS.all && modifiedParams.searchIn !== searchInMap.projects.value)
      modifiedParams.searchIn = searchInMap.projects.value;
    return buildPreciseUrl(section, modifiedParams);
  };

  const goToSection = (section) => {
    //const url = buildSection(section, params);
    console.log("PUSHING " + section);
    // props.history.push(url);
    //search(null, section);

    // Redirect illegal searchIn
  // if (initSection !== SECTIONS.all && initSearch.searchIn !== searchInMap.projects.value) {
  //   const newParams = { ...initSearch, searchIn: searchInMap.projects.value };
  //   const newUrl = Url.get(Url.pages.projects.all, newParams);
  //   props.history.push(newUrl);
  // }
  };

  return (
    // ! If not logged in, don't show the "your" and "starred" tabs.
    // ! If the user ends up there by manually entering the url, move him or show message
    // <h3>New Projects List</h3>
    <ProjectListNew
      fetched={projects.fetched}
      fetching={projects.fetching}
      getAvatar={id => this.client.getAvatarFromNamespace(id)}
      getPreciseUrl={getPreciseUrl}
      logged={props.user ? props.user.logged : false}
      orderByMap={orderByMap}
      params={params}
      projectNew={PROJECT_NEW_URL}
      projects={projects.list}
      users={users}
      search={search}
      searchInMap={searchInMap}
      sectionsMap={SECTIONS}
      setTarget={setTarget}
      target={targetUser}
      urlMap={urlMap}
    />
  );
}


class List extends Component {
  render() {
    const user = this.props.user; // TODO: change to user
    return user.fetched ?
      [
        <ProjectList key="new" {...this.props} />,
        // <AvailableUserList key="old" {...this.props} />
      ] :
      <div>
        <h1>Projects</h1>
        <Loader />
      </div>;
  }
}

class AvailableUserList extends Component {
  constructor(props) {
    super(props);
    this.model = new ProjectListModel(props.client);
    this.perPage = this.props.perPage || 10;

    this.handlers = {
      onSearchQueryChange: this.onSearchQueryChange.bind(this),
      onSearchSubmit: this.onSearchSubmit.bind(this),
      onPaginationPageChange: this.onPaginationPageChange.bind(this),
      onOrderByDropdownToggle: this.onOrderByDropdownToggle.bind(this),
      onSearchInDropdownToggle: this.onSearchInDropdownToggle.bind(this),
      changeSearchDropdownOrder: this.changeSearchDropdownOrder.bind(this),
      changeSearchDropdownFilter: this.changeSearchDropdownFilter.bind(this),
      changeSelectedUserOrGroup: this.changeSelectedUserOrGroup.bind(this),
      toggleSearchSorting: this.toggleSearchSorting.bind(this),
      getAvatarFromNamespace: this.getAvatarFromNamespace.bind(this)
    };
  }

  componentDidMount() {
    this.model.set("perPage", this.perPage);
    const {
      query, pageNumber, pathName, orderBy, orderSearchAsc, searchIn, selectedUserOrGroup
    } = this.getUrlSearchParameters(this.props.location);
    this.model.setQuery(query);
    this.model.setPathName(pathName);
    this.model.setOrderDropdownOpen(false);
    this.model.setSearchInDropdownOpen(false);
    this.model.setOrderBy(orderBy);
    this.model.setSearchIn(searchIn);
    this.model.setSelectedUserOrGroup(selectedUserOrGroup);
    this.model.setUsersOrGroupsList([]);
    this.model.setOrderSearchAsc(orderSearchAsc);
    this.model.setLoggedIn(this.props.user.logged);
    this.model.setPage(pageNumber);
    // save listener to remove it when un-mounting the component
    // TODO: this could be removed if onPaginationPageChange/this.props.history.push worked
    //    also when only the search part changed
    const listener = this.props.history.listen(location => {
      const {
        query, pageNumber, pathName, orderBy, orderSearchAsc, searchIn, selectedUserOrGroup
      } = this.getUrlSearchParameters(location);
      this.onUrlParametersChange(query, pageNumber, pathName, orderBy, orderSearchAsc, searchIn, selectedUserOrGroup);
    });
    this.setState({ listener });
  }

  componentWillUnmount() {
    const { listener } = this.state;
    if (listener)
      listener();

  }

  urlFromQueryAndPageNumber(query, pageNumber, pathName, orderBy, orderSearchAsc, searchIn, selectedUserOrGroup) {
    const selectedUsr = selectedUserOrGroup !== undefined ?
      "&selectedUserOrGroup=" + selectedUserOrGroup :
      "";
    let returnValue = `${pathName}?q=${query}&page=${pageNumber}&orderBy=${orderBy}&orderSearchAsc=`;
    returnValue += `${orderSearchAsc}&searchIn=${searchIn}${selectedUsr}`;
    return returnValue;
  }

  getUrlSearchParameters(location) {
    const pageNumber = parseInt(qs.parse(location.search).page, 10) || 1;
    const query = qs.parse(location.search).q || "";
    const orderBy = qs.parse(location.search).orderBy || orderByValuesMap.UPDATEDDATE;
    const searchIn = qs.parse(location.search).searchIn || searchInValuesMap.PROJECTNAME;
    const selectedUserOrGroup = qs.parse(location.search).selectedUserOrGroup || undefined;
    const orderSearchAsc = qs.parse(location.search).orderSearchAsc === "true" ? true : false;
    const pathName = location.pathname.endsWith("/") ?
      location.pathname.substring(0, location.pathname.length - 1) :
      location.pathname;
    this.model.setCurrentTab(pathName);
    return { query, pageNumber, pathName, orderBy, orderSearchAsc, searchIn, selectedUserOrGroup };
  }

  onUrlParametersChange(query, pageNumber, pathName, orderBy, orderSearchAsc, searchIn, selectedUserOrGroup) {
    // workaround to prevent the listener of "this.props.history.listen" to trigger in the wrong path
    // INFO: check if the path matches [/projects$, /projects/$, /projects?*, /projects/\D*]
    const regExp = /\/projects($|\/$|(\/|\?)\D+.*)$/;
    if (!regExp.test(pathName))
      return;

    this.model.setQueryPageNumberAndPath(
      query, pageNumber, pathName, orderBy, orderSearchAsc, searchIn, selectedUserOrGroup);
  }

  onPaginationPageChange(newPageNumber) {
    const query = this.model.get("query");
    const pathName = this.model.get("pathName");
    const orderBy = this.model.get("orderBy");
    const orderSearchAsc = this.model.get("orderSearchAsc");
    const searchIn = this.model.get("searchIn");
    const selectedUserOrGroup = this.model.get("selectedUserOrGroup");
    const newUrl = this.urlFromQueryAndPageNumber(
      query, newPageNumber, pathName, orderBy, orderSearchAsc, searchIn, selectedUserOrGroup);
    this.props.history.push(newUrl);
  }

  pushNewSearchToHistory() {
    this.props.history.push(
      this.urlFromQueryAndPageNumber(
        this.model.get("query"),
        1,
        this.model.get("pathName"),
        this.model.get("orderBy"),
        this.model.get("orderSearchAsc"),
        this.model.get("searchIn"),
        this.model.get("selectedUserOrGroup")
      )
    );
  }

  onOrderByDropdownToggle() {
    this.model.setOrderDropdownOpen(!this.model.get("orderByDropdownOpen"));
  }

  onSearchInDropdownToggle() {
    this.model.setSearchInDropdownOpen(!this.model.get("searchInDropdownOpen"));
  }

  changeSelectedUserOrGroup(userId) {
    this.model.setSelectedUserOrGroup(userId);
    this.pushNewSearchToHistory();
  }

  changeSearchDropdownFilter(e) {
    this.model.resetBeforeNewSearch();
    this.model.setSearchIn(e.target.value);
    this.pushNewSearchToHistory();
  }

  getSearchText() {
    switch (this.model.get("searchIn")) {
      case searchInValuesMap.PROJECTNAME:
        return "Filter by project name";
      case searchInValuesMap.USERNAME:
        return "Filter by user name";
      case searchInValuesMap.GROUPNAME:
        return "Filter by group name";
      default:
        return "Filter Text";
    }
  }

  getSearchInLabel() {
    switch (this.model.get("searchIn")) {
      case searchInValuesMap.PROJECTNAME:
        return "projects";
      case searchInValuesMap.USERNAME:
        return "users";
      case searchInValuesMap.GROUPNAME:
        return "groups";
      default:
        return "";
    }
  }

  getOrderByLabel() {
    switch (this.model.get("orderBy")) {
      case orderByValuesMap.NAME:
        return "name";
      case orderByValuesMap.CREATIONDATE:
        return "creation";
      case orderByValuesMap.UPDATEDDATE:
        return "updated";
      default:
        return "";
    }
  }

  changeSearchDropdownOrder(e) {
    this.model.setOrderBy(e.target.value);
    this.pushNewSearchToHistory();
  }

  toggleSearchSorting() {
    this.model.setOrderSearchAsc(!this.model.get("orderSearchAsc"));
    this.pushNewSearchToHistory();
  }

  onSearchQueryChange(e) {
    this.model.setQuery(e.target.value);
  }

  getAvatarFromNamespace(id) {
    return this.model.getAvatarFromNamespace(id);
  }

  onSearchSubmit(e) {
    e.preventDefault();
    const query = this.model.get("query");
    if (query && query.length && query.length < 3)
      return;

    this.model.resetBeforeNewSearch();
    this.pushNewSearchToHistory();
  }

  mapStateToProps(state, ownProps) {
    const currentPage = this.model.get("currentPage");
    return {
      user: ownProps.user,
      searchQuery: this.model.get("query"),
      orderBy: this.model.get("orderBy"),
      searchIn: this.model.get("searchIn"),
      selectedUserOrGroup: this.model.get("selectedUserOrGroup"),
      usersOrGroupsList: this.model.get("usersOrGroupsList"),
      orderByDropdownOpen: this.model.get("orderByDropdownOpen"),
      searchInDropdownOpen: this.model.get("searchInDropdownOpen"),
      orderSearchAsc: this.model.get("orderSearchAsc"),
      loading: this.model.get("loading"),
      page: this.model.get("pages")[currentPage] || { projects: [] },
      currentPage: this.model.get("currentPage"),
      totalItems: this.model.get("totalItems"),
      perPage: this.model.get("perPage"),
      onPageChange: this.handlers.onPaginationPageChange,
      getAvatarFromNamespace: this.handlers.getAvatarFromNamespace,
      selected: this.model.get("selected"),
      currentTab: this.model.get("currentTab")
    };
  }

  render() {
    const VisibleProjectList =
      connect(this.mapStateToProps.bind(this))(ProjectListPresent);

    return <VisibleProjectList
      store={this.model.reduxStore}
      user={this.props.user}
      handlers={this.handlers}
      urlMap={urlMap}
      orderByValuesMap={orderByValuesMap}
      searchInValuesMap={searchInValuesMap}
      searchText={this.getSearchText()}
      orderByLabel={this.getOrderByLabel()}
      searchInLabel={this.getSearchInLabel()}
    />;
  }
}

export default List;
export { searchInValuesMap, urlMap, ProjectList };
