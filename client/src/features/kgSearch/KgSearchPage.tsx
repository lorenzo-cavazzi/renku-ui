/*!
 * Copyright 2022 - Swiss Data Science Center (SDSC)
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

import { useState } from "react";
import { Col, Modal, ModalBody, ModalHeader, Row } from "reactstrap";

import { DatesFilter } from "../../components/dateFilter/DateFilter";
import { FilterEntitySearch } from "../../components/entitySearchFilter/EntitySearchFilter";
import QuickNav from "../../components/quicknav";
import { SearchResultsContent } from "../../components/searchResultsContent/SearchResultsContent";
import { SearchResultsHeader } from "../../components/searchResultsHeader/SearchResultsHeader";
import SortingEntities, {
  SortingOptions,
} from "../../components/sortingEntities/SortingEntities";
import { TypeEntitySelection } from "../../components/typeEntityFilter/TypeEntityFilter";
import type { UserRoles } from "../../components/userRolesFilter/userRolesFilter.types";
import { VisibilitiesFilter } from "../../components/visibilityFilter/VisibilityFilter";
import useLegacySelector from "../../utils/customHooks/useLegacySelector.hook";
import ProjectsInactiveKGWarning from "../dashboard/components/InactiveKgProjects";
import { useSearchEntitiesQuery } from "./KgSearchApi";
import { KgSearchContextProvider, useKgSearchContext } from "./KgSearchContext";

interface ModalFilterProps {
  type: TypeEntitySelection;
  role: UserRoles;
  visibility: VisibilitiesFilter;
  sort: SortingOptions;
  handleSort: (value: SortingOptions) => void;
  isOpen: boolean;
  onToggle: () => void;
  isLoggedUser: boolean;
  valuesDate: DatesFilter;
}

const ModalFilter = ({
  type,
  role,
  visibility,
  sort,
  handleSort,
  isOpen,
  onToggle,
  isLoggedUser,
  valuesDate,
}: ModalFilterProps) => {
  return (
    <Modal isOpen={isOpen} toggle={onToggle} className="filter-modal">
      <ModalHeader toggle={onToggle}>
        <span className="filter-title">Filters</span>
      </ModalHeader>
      <ModalBody>
        <div className="pb-4 w-100">
          <FilterEntitySearch
            valuesDate={valuesDate}
            type={type}
            role={role}
            visibility={visibility}
            isLoggedUser={isLoggedUser}
          />
          <SortingEntities
            styleType="mobile"
            sort={sort}
            setSort={handleSort}
          />
        </div>
      </ModalBody>
    </Modal>
  );
};

function SearchPage() {
  const user = useLegacySelector((state) => state.stateModel.user);

  const isLoggedUser = !!user.logged;
  const userName: string | undefined = user?.data?.name;

  const {
    kgSearchState,
    reducers: { setSort, reset },
  } = useKgSearchContext();
  const {
    phrase,
    sort,
    page,
    type,
    role,
    visibility,
    perPage,
    since,
    until,
    typeDate,
  } = kgSearchState;

  const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);
  const [isOpenFilter, setIsOpenFilter] = useState(true);
  const searchRequest = {
    phrase,
    sort,
    page,
    perPage,
    type,
    role,
    visibility,
    userName,
    since,
    until,
  };
  const valuesDate = {
    since,
    until,
    type: typeDate,
  };

  const { data, isFetching, isLoading, error } =
    useSearchEntitiesQuery(searchRequest);
  const filter = (
    <>
      {isOpenFilter ? (
        <Col className="col-12 col-lg-3 col-xl-2 pb-2">
          <div className="d-none d-sm-none d-md-none d-lg-block d-xl-block d-xxl-block filter-container">
            <FilterEntitySearch
              valuesDate={valuesDate}
              type={type}
              role={role}
              visibility={visibility}
              isLoggedUser={isLoggedUser}
            />
          </div>
        </Col>
      ) : null}
    </>
  );

  const searchNav = <QuickNav user={user} />;
  return (
    <>
      <Row>
        <ProjectsInactiveKGWarning />
        <Col className="col-12">{searchNav}</Col>
        <Col
          className={
            isOpenFilter
              ? "col-12 pb-2 m-auto search-header-container"
              : "col-10 pb-2 m-auto search-result-header search-header-container"
          }
        >
          <SearchResultsHeader
            handleSort={(value: SortingOptions) => setSort(value)}
            isFiltersOpened={isOpenFilter}
            isOpenFilterModal={isOpenFilterModal}
            phrase={decodeURIComponent(phrase)}
            sort={sort}
            toggleFilter={() => setIsOpenFilter(!isOpenFilter)}
            toggleFilterModal={setIsOpenFilterModal}
            total={error ? 0 : data?.total}
          />
        </Col>
        {filter}
        <Col className="col-12 col-lg-9 col-xl-10 mx-auto">
          <SearchResultsContent
            data={data}
            isFetching={isFetching}
            isLoading={isLoading}
            onRemoveFilters={reset}
            error={error}
          />
          <div className="d-sm-block d-md-none">
            <ModalFilter
              type={type}
              role={role}
              visibility={visibility}
              sort={sort}
              handleSort={(value: SortingOptions) => setSort(value)}
              isOpen={isOpenFilterModal}
              onToggle={() => setIsOpenFilterModal(!isOpenFilterModal)}
              isLoggedUser={isLoggedUser}
              valuesDate={valuesDate}
            />
          </div>
        </Col>
      </Row>
    </>
  );
}

export default function SearchPageWrapped() {
  return (
    <KgSearchContextProvider>
      <SearchPage />
    </KgSearchContextProvider>
  );
}
