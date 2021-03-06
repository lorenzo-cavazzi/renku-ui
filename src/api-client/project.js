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

import { fetchJson } from "./utils";
import yaml from "yaml-js";

const FileCategories = {
  data: (path) => path.startsWith("data"),
  notebooks: (path) => path.endsWith("ipynb"),
  workflows: (path) => path.startsWith(".renku/workflow/"),
};

function getApiURLfromRepoURL(url) {
  const urlArray = url.split("/");
  urlArray.splice(urlArray.length - 2, 0, "repos");
  url = urlArray.join("/");
  if (url.includes("https://"))
    return url.replace("https://", "https://api.");
  if (url.includes("http://"))
    return url.replace("http://", "http://api.");
}

function groupedFiles(files, projectFiles) {
  projectFiles = (projectFiles != null) ? projectFiles : {};
  Object.keys(FileCategories).forEach((cat) => {
    projectFiles[cat] = files.filter(FileCategories[cat]);
  });
  projectFiles["all"] = files;
  return projectFiles;
}

function buildTreeLazy(name, treeNode, jsonObj, hash, currentPath, gitattributes, openFilePath) {
  if (name.length === 0)
    return;

  currentPath = jsonObj.path;
  let nodeName = name;
  let nodeType = jsonObj.type; // "tree" "blob" "commit"
  const isLfs = gitattributes ? gitattributes.includes(currentPath + " filter=lfs diff=lfs merge=lfs -text") : false;
  let newNode = {
    "name": nodeName,
    "children": [],
    "jsonObj": jsonObj,
    "path": currentPath,
    "isLfs": isLfs,
    "type": nodeType
  };
  hash[newNode.path] = {
    "name": nodeName,
    "selected": false,
    "childrenOpen": false,
    "childrenLoaded": false,
    "path": currentPath,
    "isLfs": isLfs,
    "type": nodeType,
    "treeRef": newNode
  };
  treeNode.push(newNode);
}

function getFilesTreeLazy(client, files, projectId, openFilePath, lfsFiles) {
  let tree = [];
  let hash = {};
  let lfs = files.filter((treeObj) => treeObj.path === ".gitattributes");

  if (lfs.length > 0) {
    return client.getRepositoryFile(projectId, lfs[0].path, "master", "raw")
      .then(json => {
        for (let i = 0; i < files.length; i++)
          buildTreeLazy(files[i].name, tree, files[i], hash, "", json, openFilePath);

        const treeObj = { tree: tree, hash: hash, lfsFiles: json };
        return treeObj;
      });
  }
  for (let i = 0; i < files.length; i++)
    buildTreeLazy(files[i].name, tree, files[i], hash, "", lfsFiles, openFilePath);

  const treeObj = { tree: tree, hash: hash, lfsFiles: lfsFiles };
  return treeObj;

}

function addProjectMethods(client) {

  client.getProjects = (queryParams = {}) => {
    let headers = client.getBasicHeaders();
    return client.clientFetch(`${client.baseUrl}/projects`, {
      method: "GET",
      headers,
      queryParams,
    });
  };

  client.getAvatarForNamespace = (namespaceId = {}) => {
    let headers = client.getBasicHeaders();
    return client.clientFetch(`${client.baseUrl}/groups/${namespaceId}`, {
      method: "GET",
      headers
    }).then(response => response.data.avatar_url);
  };

  client.getProject = (projectPathWithNamespace, options = {}) => {
    const headers = client.getBasicHeaders();
    const queryParams = {
      statistics: options.statistics || false
    };
    return client.clientFetch(`${client.baseUrl}/projects/${encodeURIComponent(projectPathWithNamespace)}`, {
      method: "GET",
      headers,
      queryParams
    }).then(resp => {
      return { ...resp, data: carveProject(resp.data) };
    });
  };

  client.getProjectById = (projectId, options = {}) => {
    const headers = client.getBasicHeaders();
    const queryParams = {
      statistics: options.statistics || false
    };
    return client.clientFetch(`${client.baseUrl}/projects/${projectId}`, {
      method: "GET",
      headers,
      queryParams
    }).then(resp => {
      return { ...resp, data: carveProject(resp.data) };
    });
  };

  client.getProjectsBy = (searchIn, userOrGroupId, queryParams) => {
    if (searchIn === "groups")
      queryParams.include_subgroups = true;
    let headers = client.getBasicHeaders();
    return client.clientFetch(`${client.baseUrl}/${searchIn}/${userOrGroupId}/projects`, {
      method: "GET",
      headers,
      queryParams
    });
  };

  client.searchUsersOrGroups = (queryParams, searchIn) => {
    let headers = client.getBasicHeaders();
    if (searchIn === "groups")
      queryParams.all_available = true;
    return client.clientFetch(`${client.baseUrl}/${searchIn}`, {
      method: "GET",
      headers,
      queryParams
    }).then(result => result.data);
  };

  client.getProjectFiles = (projectId, path = "") => {
    return client.getRepositoryTree(projectId, { path: path, recursive: true }).then((tree) => {
      const files = tree
        .filter((treeObj) => treeObj.type === "blob")
        .map((treeObj) => treeObj.path);
      return groupedFiles(files, {});
    });
  };

  client.getProjectFilesTree = (projectId, openFilePath, currentPath = "", lfsFiles) => {
    return client.getRepositoryTree(projectId, { path: currentPath, recursive: false }).then((tree) => {
      const fileStructure = getFilesTreeLazy(client, tree, projectId, openFilePath, lfsFiles);
      return fileStructure;
    });
  };

  client.getEmptyProjectObject = () => { return { folder: "empty-project-template", name: "Empty Project" }; };

  client.postProject = (renkuProject, renkuTemplatesUrl, renkuTemplatesRef) => {
    const gitlabProject = {
      name: renkuProject.display.title,
      description: renkuProject.display.description,
      visibility: renkuProject.meta.visibility
    };
    if (renkuProject.meta.projectNamespace != null) gitlabProject.namespace_id = renkuProject.meta.projectNamespace.id;
    const headers = client.getBasicHeaders();
    headers.append("Content-Type", "application/json");

    if (renkuProject.meta.template === client.getEmptyProjectObject().folder) {
      let createGraphWebhookPromise;
      const newProjectPromise = client.clientFetch(`${client.baseUrl}/projects`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(gitlabProject)
      }).then(resp => {
        if (!renkuProject.meta.optoutKg)
          createGraphWebhookPromise = client.createGraphWebhook(resp.data.id);

        return resp.data;
      });

      let promises = [newProjectPromise];
      if (createGraphWebhookPromise)
        promises = promises.concat(createGraphWebhookPromise);


      return Promise.all(promises)
        .then(([data, payload]) => {
          if (data.errorData)
            return Promise.reject(data);
          return Promise.resolve(data).then(() => data);
        });

    }
    let createGraphWebhookPromise;
    const newProjectPromise = client.clientFetch(`${client.baseUrl}/projects`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(gitlabProject)
    }).then(resp => {
      if (!renkuProject.meta.optoutKg)
        createGraphWebhookPromise = client.createGraphWebhook(resp.data.id);

      return resp.data;
    });

    // When the provided version does not exist, we log an error and uses latest.
    // Maybe this should raise a more prominent alarm?
    const payloadPromise = getPayload(
      gitlabProject.name,
      renkuTemplatesUrl,
      renkuTemplatesRef,
      renkuProject.meta.template
    ).catch(error => {
      return getPayload(gitlabProject.name, renkuTemplatesUrl, renkuTemplatesRef, renkuProject.meta.template);
    });
    let promises = [newProjectPromise, payloadPromise];

    if (createGraphWebhookPromise)
      promises = promises.concat(createGraphWebhookPromise);


    return Promise.all(promises)
      .then(([data, payload]) => {
        if (data.errorData)
          return Promise.reject(data);
        return client.postCommit(data.id, payload).then(() => data);
      });

  };

  client.getProjectStatus = (projectId) => {
    const headers = client.getBasicHeaders();
    headers.append("Content-Type", "application/json");
    return client.clientFetch(`${client.baseUrl}/projects/${projectId}/import`, {
      method: "GET",
      headers: headers
    }).then(resp => {
      return resp.data.import_status;
    }).catch((error) => "error");
  };

  client.startPipeline = (projectId) => {
    const headers = client.getBasicHeaders();
    headers.append("Content-Type", "application/json");
    let pipelineStarted = false;
    let counter = 0;
    const projectStatusTimeout = setInterval(() => {
      if (pipelineStarted === true || counter === 100) { clearInterval(projectStatusTimeout); }
      else {
        client.getProjectStatus(projectId).then((forkProjectStatus) => {
          if (forkProjectStatus === "finished") {
            client.runPipeline(projectId).then(resp => {
              pipelineStarted = true;
              clearInterval(projectStatusTimeout);
            });
          }
          else if (forkProjectStatus === "failed" || forkProjectStatus === "error") {
            clearInterval(projectStatusTimeout);
          }
          else {
            counter++;
          }
        });
      }
    }, 3000);
  };

  function redirectWhenForkFinished(projectId, projectPathWithNamespace, history) {
    const headers = client.getBasicHeaders();
    headers.append("Content-Type", "application/json");
    let redirected = false;
    let counter = 0;
    const projectStatusTimeout = setInterval(() => {
      if (redirected === true || counter === 200) { clearInterval(projectStatusTimeout); }
      else {
        client.getProjectStatus(projectId).then((forkProjectStatus) => {
          if (forkProjectStatus === "finished") {
            redirected = true;
            clearInterval(projectStatusTimeout);
            history.push(`/projects/${projectPathWithNamespace}`);
          }
          else if (forkProjectStatus === "failed" || forkProjectStatus === "error") {
            clearInterval(projectStatusTimeout);
          }
          else {
            counter++;
          }
        });
      }
    }, 3000);
  }

  client.forkProject = (projectSchema, history) => {
    const projectMeta = projectSchema.meta;
    const gitlabProject = {
      id: projectMeta.id,
      name: projectSchema.display.title,
      path: projectSchema.display.slug
    };
    if (projectMeta.projectNamespace != null) gitlabProject.namespace = projectMeta.projectNamespace.id;
    const headers = client.getBasicHeaders();
    headers.append("Content-Type", "application/json");

    let createGraphWebhookPromise;
    const newProjectPromise = client.clientFetch(`${client.baseUrl}/projects/${projectMeta.id}/fork`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(gitlabProject)
    }).then(resp => {
      if (!projectMeta.optoutKg)
        createGraphWebhookPromise = client.createGraphWebhook(resp.data.id);

      return resp;
    }).then(resp => {
      client.startPipeline(resp.data.id);
      return resp;
    });

    let promises = [newProjectPromise];
    if (createGraphWebhookPromise)
      promises = promises.concat(createGraphWebhookPromise);


    return Promise.all(promises)
      .then((results) => {
        if (results.errorData)
          return Promise.reject(results);
        return Promise.resolve(results)
          .then(() => redirectWhenForkFinished(results[0].data.id, results[0].data.path_with_namespace, history));
      });
  };

  client.setTags = (projectId, name, tags) => {
    return client.putProjectField(projectId, name, "tag_list", tags);
  };

  client.setDescription = (projectId, name, description) => {
    return client.putProjectField(projectId, name, "description", description);
  };

  client.starProject = (projectId, starred) => {
    const headers = client.getBasicHeaders();
    headers.append("Content-Type", "application/json");
    const endpoint = starred ? "unstar" : "star";

    return client.clientFetch(`${client.baseUrl}/projects/${projectId}/${endpoint}`, {
      method: "POST",
      headers: headers,
    });

  };

  client.putProjectField = (projectId, name, field_name, field_value) => {
    const putData = { id: projectId, name, [field_name]: field_value };
    const headers = client.getBasicHeaders();
    headers.append("Content-Type", "application/json");

    return client.clientFetch(`${client.baseUrl}/projects/${projectId}`, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(putData)
    });

  };

  client.getArtifactsUrl = (projectId, job, branch = "master") => {
    const headers = client.getBasicHeaders();
    return client.clientFetch(`${client.baseUrl}/projects/${projectId}/jobs`, {
      method: "GET",
      headers: headers
    })
      .then(resp => resp.data)
      .then(jobs => {
        if (!jobs) return;
        const filteredJobs = jobs.filter(j => j.name === job && j.ref === branch);
        if (filteredJobs.length < 1)
          throw new Error(`There are no artifacts for project/job (${projectId}/${job}) because there are no jobs`);
        // Sort in reverse finishing order and take the most recent
        const jobObj =
          filteredJobs
            .sort((a, b) => (a.finished_at > b.finished_at) ? -1 : +(a.finished_at < b.finished_at))[0];
        return `${client.baseUrl}/projects/${projectId}/jobs/${jobObj.id}/artifacts`;
      });
  };

  client.getArtifact = (projectId, job, artifact, branch = "master") => {
    const options = { method: "GET", headers: client.getBasicHeaders() };
    return client.getArtifactsUrl(projectId, job, branch)
      .then(url => {
        // If the url is undefined, we return an object with a dummy text() method.
        if (!url) return ["", { text: () => "" }];
        const resourceUrl = `${url}/${artifact}`;
        return Promise.all([resourceUrl, client.clientFetch(resourceUrl, options, client.returnTypes.full)]);
      });
  };

  client.getProjectTemplates = (renkuTemplatesUrl, renkuTemplatesRef) => {
    const formatedApiURL = getApiURLfromRepoURL(renkuTemplatesUrl);
    return fetchJson(`${formatedApiURL}/git/trees/${renkuTemplatesRef}`)
      .then(data => data.tree.filter(obj => obj.path === "manifest.yaml")[0]["sha"])
      .then(manifestSha => fetchJson(`${formatedApiURL}/git/blobs/${manifestSha}`))
      .then(data => { return yaml.load(atob(data.content)); })
      .then(data => { data.push(client.getEmptyProjectObject()); return data; });
  };

  client.getDatasetJson = (projectId, datasetId) => {
    return client.getRepositoryFile(projectId, `.renku/datasets/${datasetId}/metadata.yml`, "master", "raw")
      .then(result => yaml.load(result));
  };

  client.fetchDatasetFromKG = (datasetLink) => {
    const headers = client.getBasicHeaders();
    const datasetPromise = client.clientFetch(datasetLink, { method: "GET", headers });
    return Promise.resolve(datasetPromise).then(dataset => dataset.data);
  };

  client.getProjectDatasetsFromKG = (projectPath) => {
    let url = `${client.baseUrl}/knowledge-graph/projects/${projectPath}/datasets`;
    url = url.replace("/api", "");//The url should change in the backend so we don't have to do this
    const headers = client.getBasicHeaders();
    return client.clientFetch(url, { method: "GET", headers }).then((resp) => {
      return resp.data;
    });
  };

  client.getProjectDatasets = (projectId) => {
    const datasetsPromise = client.getRepositoryTree(projectId, { path: ".renku/datasets", recursive: true })
      .then(data =>
        data.filter(treeObj => treeObj.type === "blob" && treeObj.name === "metadata.yml")
          .map(dataset =>
            client.getRepositoryFile(projectId, dataset.path, "master", "raw").then(result => yaml.load(result))
          )
      );

    return Promise.resolve(datasetsPromise)
      .then(datasetsContent => Promise.all(datasetsContent));
  };
}


function carveProject(projectJson) {
  const result = { metadata: { core: {}, visibility: {}, system: {}, statistics: {} }, all: projectJson };
  result["metadata"]["visibility"]["level"] = projectJson["visibility"];

  let accessLevel = 0;
  if (projectJson.permissions && projectJson.permissions.project_access)
    accessLevel = Math.max(accessLevel, projectJson.permissions.project_access.access_level);

  if (projectJson.permissions && projectJson.permissions.group_access)
    accessLevel = Math.max(accessLevel, projectJson.permissions.group_access.access_level);

  result["metadata"]["visibility"]["accessLevel"] = accessLevel;


  result["metadata"]["core"]["created_at"] = projectJson["created_at"];
  result["metadata"]["core"]["last_activity_at"] = projectJson["last_activity_at"];
  result["metadata"]["core"]["id"] = projectJson["id"];
  result["metadata"]["core"]["description"] = projectJson["description"];
  result["metadata"]["core"]["displayId"] = projectJson["path_with_namespace"];
  result["metadata"]["core"]["title"] = projectJson["name"];
  result["metadata"]["core"]["external_url"] = projectJson["web_url"];
  result["metadata"]["core"]["path_with_namespace"] = projectJson["path_with_namespace"];
  result["metadata"]["core"]["owner"] = projectJson["owner"];
  result["metadata"]["core"]["namespace_path"] = projectJson["namespace"]["full_path"];
  result["metadata"]["core"]["project_path"] = projectJson["path"];

  result["metadata"]["system"]["tag_list"] = projectJson["tag_list"];
  result["metadata"]["system"]["star_count"] = projectJson["star_count"];
  result["metadata"]["system"]["forks_count"] = projectJson["forks_count"];
  result["metadata"]["system"]["ssh_url"] = projectJson["ssh_url_to_repo"];
  result["metadata"]["system"]["http_url"] = projectJson["http_url_to_repo"];
  result["metadata"]["system"]["forked_from_project"] = (projectJson["forked_from_project"] != null) ?
    carveProject(projectJson["forked_from_project"]) :
    null;

  if (projectJson.statistics != null) {
    result["metadata"]["statistics"]["commit_count"] = projectJson["statistics"]["commit_count"];
    result["metadata"]["statistics"]["storage_size"] = projectJson["statistics"]["storage_size"];
    result["metadata"]["statistics"]["repository_size"] = projectJson["statistics"]["repository_size"];
    result["metadata"]["statistics"]["lfs_objects_size"] = projectJson["statistics"]["lfs_objects_size"];
    result["metadata"]["statistics"]["job_artificats_size"] = projectJson["statistics"]["job_artificats_size"];
  }
  return result;
}


// NOTE: An unregistered user can do 60 GitHub api requests per hour max meaning,
//       that this approach fails when trying to create more than 30 projects
//       per hour. I think we can live with that for the moment. However, it might
//       make sense at some point to serve the project template from the GitLab
//       instance we're working with.

function getPayload(projectName, renkuTemplatesUrl, renkuTemplatesRef, projectTemplate) {
  // Promise which will resolve into the repository sub-tree
  // which matches the desired version of the renku project template.
  const formatedApiURL = getApiURLfromRepoURL(renkuTemplatesUrl);
  const subTreePromise = fetchJson(`${formatedApiURL}/git/trees/${renkuTemplatesRef}`)
    .then(data => data.tree.filter(obj => obj.path === projectTemplate)[0]["sha"])
    .then(treeSha => fetchJson(`${formatedApiURL}/git/trees/${treeSha}?recursive=1`));

  // Promise which will resolve into a list of file creation actions
  // ready to be passed to the GitLab API.
  const actionsPromise = subTreePromise.then(subtree => {
    const actionPromises = subtree.tree
      .filter(treeObject => treeObject.type === "blob")
      .map(treeObject => getActionPromise(treeObject, projectName));
    return Promise.all(actionPromises);
  });

  // We finally return a promise which will resolve into the full
  // payload for the first commit to the newly created project.
  return actionsPromise.then((resolvedActions) => {
    return {
      "branch": "master",
      "commit_message": "init renku repository",
      "actions": resolvedActions
    };
  });

  function getActionPromise(treeObject, projectName) {

    return fetchJson(treeObject.url)
      .then(data => atob(data.content))
      .then(fileContent => {
        return {
          "action": "create",
          "file_path": treeObject.path,
          "content": evaluateTemplate(fileContent, projectName)
        };
      });
  }

  function evaluateTemplate(content, projectName) {

    const now = new Date();
    const templatedVariables = {
      "name": projectName,
      "date_updated": now.toISOString(),
      "date_created": now.toISOString(),
    };

    const newContent = content.replace(/{{\s?([^\s]*)\s?}}/g, (match, group) => {
      return templatedVariables[group];
    });
    return newContent;
  }

}

export default addProjectMethods;
export { carveProject };
