import React from "react";
import { RootStateOrAny, useSelector } from "react-redux";

import { ACCESS_LEVELS } from "../../../api-client";
import DatasetView from "../../../dataset/Dataset.present";
import { Url } from "../../../utils/helpers/url";

import { useGetDatasetFilesQuery, useGetDatasetKgQuery } from "../projectCoreApi";
import type { DatasetCore, DatasetKg, IDataset, IMigration, StateModelProject } from "../Project.d";

type IDatasetCoordinator = {
  fetchDataset: (id: string, datasets: DatasetCore[], fetchKG: boolean) => void;
  fetchDatasetFilesFromCoreService: (id: string, httpProjectUrl: string, versionUrl: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(key: string): any;
};

type ProjectDatasetShowProps = {
  datasetCoordinator: unknown;
  datasetId: string;
  graphStatus: boolean;
  history: unknown;
  location: unknown;
  model: unknown;
  projectInsideKg: boolean;
};

type ProjectDatasetViewProps = {
  datasetCoordinator: IDatasetCoordinator;
  datasets: DatasetCore[];
  datasetId: string;
  fileContentUrl: string;
  graphStatus: boolean;
  history: unknown;
  httpProjectUrl: string;
  lineagesUrl: string;
  location: unknown;
  lockStatus: unknown;
  logged: unknown;
  maintainer: boolean;
  migration: IMigration;
  model: unknown;
  overviewStatusUrl: string;
  projectId: string;
  projectInsideKg: boolean;
  projectPathWithNamespace: string;
  projectsUrl: string;
};

function findDataset(name: string, datasets: DatasetCore[]) {
  return datasets.find((d) => d.name === name);
}

function findDatasetId(name?: string, datasets?: DatasetCore[]) {
  if (name == null || datasets == null) return undefined;
  const dataset = findDataset(name, datasets);
  return dataset?.identifier;
}

function mergeCoreAndKgDatasets(coreDataset?: DatasetCore, kgDataset?: DatasetKg) {
  if (coreDataset == null) {
    if (kgDataset == null) return undefined;
    const dataset: IDataset = { exists: true, insideKg: true, ...kgDataset };
    return dataset;
  }

  const dataset: IDataset = {
    created: coreDataset.created_at,
    exists: true,
    insideKg: kgDataset != null,
    ...coreDataset,
  };
  dataset.published = {
    creator: coreDataset.creators,
  };
  if (kgDataset) {
    dataset.url = kgDataset.url;
    dataset.sameAs = kgDataset.sameAs;
    dataset.usedIn = kgDataset.usedIn;
    dataset.published.datePublished =
      kgDataset.published && kgDataset.published.datePublished ? kgDataset.published.datePublished : undefined;
  }
  return dataset;
}

function ProjectDatasetView(props: ProjectDatasetViewProps) {
  const coreDataset = findDataset(props.datasetId, props.datasets);
  const datasetId = findDatasetId(props.datasetId, props.datasets);
  const migration = props.migration;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const versionUrl = migration.core.versionUrl!;
  const {
    data: kgDataset,
    error: kgFetchError,
    isFetching: isKgFetching,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  } = useGetDatasetKgQuery({ id: datasetId! }, { skip: !datasetId });
  const currentDataset = mergeCoreAndKgDatasets(coreDataset, kgDataset);
  //  const { }
  const datasetName = currentDataset?.name;
  const {
    data: datasetFiles,
    error: filesFetchError,
    isFetching: isFilesFetching,
  } = useGetDatasetFilesQuery(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    { git_url: props.httpProjectUrl, name: datasetName!, versionUrl },
    { skip: !datasetName }
  );

  const loadingDatasets = currentDataset == null || currentDataset.identifier !== datasetId || isKgFetching;
  return (
    <DatasetView
      client={undefined}
      dataset={currentDataset}
      files={datasetFiles}
      isFilesFetching={isFilesFetching}
      filesFetchError={filesFetchError}
      datasets={props.datasets}
      fetchError={kgFetchError}
      fetchedKg={kgDataset != null}
      fileContentUrl={props.fileContentUrl}
      history={props.history}
      httpProjectUrl={props.httpProjectUrl}
      identifier={datasetId}
      insideProject={true}
      lineagesUrl={props.lineagesUrl}
      loadingDatasets={loadingDatasets}
      location={props.location}
      lockStatus={props.lockStatus}
      logged={props.logged}
      maintainer={props.maintainer}
      migration={migration}
      model={props.model}
      overviewStatusUrl={props.overviewStatusUrl}
      progress={undefined}
      projectId={props.projectId}
      projectInsideKg={props.projectInsideKg}
      projectPathWithNamespace={props.projectPathWithNamespace}
      projectsUrl={props.projectsUrl}
    />
  );
}

function ProjectDatasetShow(props: ProjectDatasetShowProps) {
  const project = useSelector((state: RootStateOrAny) => state.stateModel.project as StateModelProject);
  const user = useSelector((state: RootStateOrAny) => state.stateModel.user);
  const projectMetadata = project.metadata;
  const accessLevel = projectMetadata.accessLevel;
  const datasets = project.datasets.core.datasets;
  const httpProjectUrl = projectMetadata.httpUrl;
  const lockStatus = project.lockStatus;
  const maintainer = accessLevel >= ACCESS_LEVELS.MAINTAINER ? true : false;
  const migration = project.migration;
  const projectPathWithNamespace = projectMetadata.pathWithNamespace;
  const projectId = projectMetadata.id;

  const projectPath = projectMetadata.path;
  const projectNamespace = projectMetadata.namespace;
  const projectUrlProps = { namespace: projectNamespace, path: projectPath, target: "" };
  const fileContentUrl = Url.get(Url.pages.project.file, projectUrlProps);
  const lineageUrl = Url.get(Url.pages.project.lineage, projectUrlProps);
  // Remove the trailing slash, since that is how downstream components expect it.
  const lineagesUrl = lineageUrl.substring(0, lineageUrl.length - 1);
  const overviewStatusUrl = Url.get(Url.pages.project.overview.status, projectUrlProps);
  const projectsUrl = Url.get(Url.pages.projects);
  if (props.datasetCoordinator == null) return null;
  return (
    <ProjectDatasetView
      key="datasetPreview"
      datasets={datasets as DatasetCore[]}
      datasetCoordinator={props.datasetCoordinator as IDatasetCoordinator}
      datasetId={props.datasetId}
      fileContentUrl={fileContentUrl}
      graphStatus={props.graphStatus}
      history={props.history}
      httpProjectUrl={httpProjectUrl}
      lineagesUrl={lineagesUrl}
      location={props.location}
      lockStatus={lockStatus}
      logged={user.logged}
      maintainer={maintainer}
      migration={migration as IMigration}
      model={props.model}
      overviewStatusUrl={overviewStatusUrl}
      projectId={projectId}
      projectInsideKg={props.projectInsideKg}
      projectPathWithNamespace={projectPathWithNamespace}
      projectsUrl={projectsUrl}
    />
  );
}

export default ProjectDatasetShow;