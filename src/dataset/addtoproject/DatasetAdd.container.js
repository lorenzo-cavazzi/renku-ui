/*!
 * Copyright 2017 - Swiss Data Science Center (SDSC)
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

/**
 *  incubator-renku-ui
 *
 *  DatasetAdd.container.js
 *  Container components for add dataset to project.
 */


import React, { useState, useEffect } from "react";
import { addDatasetToProjectSchema } from "../../model/RenkuModels";
import { ACCESS_LEVELS, API_ERRORS } from "../../api-client";
import DatasetAdd from "./DatasetAdd.present";
import { ImportStateMessage } from "../../utils/Dataset";
import { groupBy } from "../../utils/HelperFunctions";
import { GraphIndexingStatus } from "../../project/Project.state";

function AddDataset(props) {

  const [serverErrors, setServerErrors] = useState(undefined);
  const [submitLoader, setSubmitLoader] = useState(false);
  const [submitLoaderText, setSubmitLoaderText] = useState(ImportStateMessage.ENQUEUED);

  const closeModal = () =>{
    if (!submitLoader) {
      addDatasetToProjectSchema.project.value = "";
      addDatasetToProjectSchema.project.options = [];
      props.setModalOpen(false);
    }
  };

  const redirectUserAndClearInterval = (datasets, oldDatasetsList, waitForDatasetInKG, projectPath) => {
    let new_dataset = datasets.filter(ds =>
      oldDatasetsList.find(ods => ds.identifier === ods.identifier) === undefined);
    if (new_dataset.length > 0) {
      setSubmitLoader(false);
      addDatasetToProjectSchema.project.value = "";
      addDatasetToProjectSchema.project.options = [];
      clearInterval(waitForDatasetInKG);
      props.history.push({
        pathname: `/projects/${projectPath}/datasets/${new_dataset[0].identifier}/`,
        state: { datasets: datasets }
      })
      ;
    }
  };

  const checkKgStatusAnRedirect = (oldDatasetsList, projectPath, kgProgressCompleted) => {
    if (!kgProgressCompleted) {
      setSubmitLoader(false);
      addDatasetToProjectSchema.project.value = "";
      addDatasetToProjectSchema.project.options = [];
      props.history.push(`/projects/${projectPath}/datasets`);
    }
    else {
      let waitForDatasetInKG = setInterval(() => {
        let cont = 0;
        props.client.getProjectDatasetsFromKG_short(projectPath)
          .then(datasets => {
            cont++;
            if (datasets.length !== oldDatasetsList.length) {
              if (cont < 5) {
                redirectUserAndClearInterval(datasets, oldDatasetsList, waitForDatasetInKG, projectPath);
              }
              else {
                setSubmitLoader(false);
                addDatasetToProjectSchema.project.value = "";
                addDatasetToProjectSchema.project.options = [];
                clearInterval(waitForDatasetInKG);
                setServerErrors(ImportStateMessage.KG_TOO_LONG);
              }
            }
          });
      }, 6000);
    }
  };

  function handleJobResponse(job, monitorJob, cont, oldDatasetsList, projectPath, kgProgressCompleted) {
    if (job) {
      switch (job.state) {
        case "ENQUEUED":
          setSubmitLoaderText(ImportStateMessage.ENQUEUED);
          break;
        case "IN_PROGRESS":
          setSubmitLoaderText(ImportStateMessage.IN_PROGRESS);
          break;
        case "COMPLETED":
          setSubmitLoaderText(ImportStateMessage.COMPLETED);
          clearInterval(monitorJob);
          checkKgStatusAnRedirect(oldDatasetsList, projectPath, kgProgressCompleted);
          break;
        case "FAILED":
          setSubmitLoader(false);
          setServerErrors(ImportStateMessage.FAILED + job.extras.error);
          clearInterval(monitorJob);
          break;
        default:
          setSubmitLoader(false);
          setServerErrors(ImportStateMessage.FAILED_NO_INFO);
          clearInterval(monitorJob);
          break;
      }
    }
    if ((cont > 30 && job.state !== "IN_PROGRESS") || (cont > 50 && job.state === "IN_PROGRESS")) {
      setSubmitLoader(false);
      setServerErrors(ImportStateMessage.TOO_LONG);
      clearInterval(monitorJob);
    }
  }

  const monitorJobStatusAndHandleResponse = (job_id, oldDatasetsList, projectPath, kgProgressCompleted) => {
    let cont = 0;
    let monitorJob = setInterval(() => {
      props.client.getJobStatus(job_id)
        .then(job => {
          cont++;
          if (job !== undefined)
            handleJobResponse(job, monitorJob, cont, oldDatasetsList, projectPath, kgProgressCompleted);
        });
    }, 10000);
  };

  const fetchGraphStatus = (projectId) =>{
    return props.client.checkGraphStatus(projectId)
      .then((resp) => {
        let progress;
        if (resp.progress == null)
          progress = GraphIndexingStatus.NO_PROGRESS;

        if (resp.progress === 0 || resp.progress)
          progress = resp.progress;

        return progress;
      })
      .catch((err) => {
        if (err.case === API_ERRORS.notFoundError) {
          const progress = GraphIndexingStatus.NO_WEBHOOK;
          return progress;
        }
        throw err;
      });
  };

  const submitCallback = e => {
    setServerErrors(undefined);
    setSubmitLoader(true);
    let oldDatasetsList = [];
    const selectedProject = addDatasetToProjectSchema.project.options.find((project)=>
      project.value === addDatasetToProjectSchema.project.value);

    fetchGraphStatus(selectedProject.id).then(resp => {
      if (resp < GraphIndexingStatus.MAX_VALUE) {
        props.client.datasetImport(selectedProject.value, props.dataset.url)
          .then(response => {
            if (response.data.error !== undefined) {
              setSubmitLoader(false);
              setServerErrors(response.data.error.reason);
            }
            else {
              monitorJobStatusAndHandleResponse(
                response.data.result.job_id,
                oldDatasetsList,
                selectedProject.name,
                false);
            }
          });
      }
      else {
        props.client.getProjectDatasetsFromKG_short(selectedProject.name)
          .then(result => {
            oldDatasetsList = result;
            props.client.datasetImport(selectedProject.value, props.dataset.url)
              .then(response => {
                if (response.data.error !== undefined) {
                  setSubmitLoader(false);
                  setServerErrors(response.data.error.reason);
                }
                else {
                  monitorJobStatusAndHandleResponse(
                    response.data.result.job_id,
                    oldDatasetsList,
                    selectedProject.name,
                    true);
                }
              });
          });
      }
    });
  };

  addDatasetToProjectSchema.project.customHandlers = {
    onSuggestionsFetchRequested: ( value, reason, setSuggestions ) => {

      const featured = props.projectsCoordinator.model.get("featured");
      if (!featured.fetched || (!featured.starred.length && !featured.member.length))
        return;

      const regex = new RegExp(value, "i");
      const searchDomain = featured.member.filter((project)=> project.access_level >= ACCESS_LEVELS.MAINTAINER);

      if (addDatasetToProjectSchema.project.options.length !== searchDomain.length) {
        addDatasetToProjectSchema.project.options = searchDomain.map((project)=>({
          "value": project.http_url_to_repo, "name": project.path_with_namespace, "id": project.id
        }));
      }

      const hits = {};
      const groupedSuggestions = [];

      searchDomain.forEach(d => {
        if (regex.exec(d.path_with_namespace) != null) {
          hits[d.path_with_namespace] = {
            "value": d.http_url_to_repo,
            "name": d.path_with_namespace,
            "subgroup": d.path_with_namespace.split("/")[0],
            "id": d.id
          };
        }
      });

      const hitValues = Object.values(hits).sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
      const groupedHits = groupBy(hitValues, item => item.subgroup);
      for (var [key, val] of groupedHits) {
        groupedSuggestions.push({
          title: key,
          suggestions: val
        });
      }
      setSuggestions(groupedSuggestions);
    }
  };

  useEffect(()=> {
    addDatasetToProjectSchema.project.value = "";
  });

  return (
    <DatasetAdd
      modalOpen={props.modalOpen}
      closeModal={closeModal}
      submitCallback={submitCallback}
      serverErrors={serverErrors}
      submitLoader={submitLoader}
      submitLoaderText={submitLoaderText}
      addDatasetToProjectSchema={addDatasetToProjectSchema}
    />
  );
}

export default AddDataset;