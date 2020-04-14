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

import React, { useState } from "react";
import NotebookPreview from "@nteract/notebook-render";

import { Card, CardHeader, CardBody, Badge } from "reactstrap";
import { Button, ButtonGroup } from "reactstrap";
import { ListGroup, ListGroupItem } from "reactstrap";
import "../../node_modules/highlight.js/styles/atom-one-light.css";
import { faProjectDiagram } from "@fortawesome/free-solid-svg-icons";
import { faGitlab } from "@fortawesome/free-brands-svg-icons";

import { FilePreview } from "./index";
import { CheckNotebookStatus, CheckNotebookIcon } from "../notebooks";
import { Clipboard, ExternalIconLink, IconLink, Loader } from "../utils/UIComponents";
import { Time } from "../utils/Time";

const commitMessageLengthLimit = 120;

/**
 * Display the Card with file information. Has the following parameters:
 *
 * @param {string} gitLabUrl - Url to GitLab.
 * @param {string} filePath - Path of the file
 * @param {Object} commit - Information from GitLab about the commit.
 * @param {Component} buttonGraph - Button to switch to graph view
 * @param {Component} buttonGit - Button to switch to GitLab.
 * @param {Component} buttonJupyter - Button to switch to Jupyter.
 * @param {Object} body - Content to show as the body of the card
 * @param {Component} lfsBadge - Badge to show for LFS (or null)
 */
class FileCard extends React.Component {
  render() {
    let commitHeader = null;
    if (this.props.commit) {
      const commitLinkHref = `${this.props.gitLabUrl}/commit/${this.props.commit.id}`;
      const title =
        this.props.commit.title.length > commitMessageLengthLimit
          ? this.props.commit.title.slice(0, commitMessageLengthLimit) + "..."
          : this.props.commit.title;
      commitHeader = (
        <ListGroup flush>
          <ListGroupItem>
            <div className="d-flex justify-content-between flex-wrap">
              <div>
                <a href={commitLinkHref} target="_blank" rel="noreferrer noopener">
                  Commit: {this.props.commit.short_id}
                </a>{" "}
                &nbsp;
                {title}
              </div>
              <div className="caption">
                {this.props.commit.author_name} &nbsp;
                {Time.toIsoString(this.props.commit.committed_date)}
              </div>
            </div>
          </ListGroupItem>
        </ListGroup>
      );
    }
    return (
      <Card>
        <CardHeader className="align-items-baseline">
          {this.props.lfsBadge}
          {this.props.filePath}
          &nbsp;
          <Clipboard clipboardText={this.props.filePath} />
          &nbsp;
          <span className="caption align-baseline">&nbsp;File view</span>
          <div className="float-right">
            {this.props.buttonJupyter}
            {this.props.buttonGit}
            {this.props.buttonGraph}
          </div>
        </CardHeader>
        {commitHeader}
        <CardBody>{this.props.body}</CardBody>
      </Card>
    );
  }
}

/**
 * Display a file with some metadata. Has the following parameters:
 *
 * @param {string} externalUrl - Url to GitLab.
 * @param {string} filePath - Path of the file
 * @param {string} gitLabFilePath - Path of the file in gitLab
 * @param {string} lineagesPath - Path to get the lineage
 * @param {Component} buttonJupyter - A button to connect to jupyter
 * @param {Object} file - The file object from GitLab (can be null)
 * @param {Object} commit - The commit object from GitLab (can be null)
 * @param {Object} error - The error object from GitLab (can be null)
 */
class ShowFile extends React.Component {
  render() {
    const gitLabFilePath = this.props.gitLabFilePath;
    const buttonGraph =
      this.props.lineagesPath !== undefined ? (
        <IconLink tooltip="Graph View" icon={faProjectDiagram} to={`${this.props.lineagesPath}/${gitLabFilePath}`} />
      ) : null;

    const buttonGit = (
      <ExternalIconLink
        tooltip="Open in GitLab"
        icon={faGitlab}
        to={`${this.props.externalUrl}/blob/master/${gitLabFilePath}`}
      />
    );

    if (this.props.error !== null) {
      return (
        <FileCard
          gitLabUrl={this.props.externalUrl}
          filePath={this.props.gitLabFilePath.split("\\").pop().split("/").pop()}
          commit={this.props.commit}
          buttonGraph={buttonGraph}
          buttonGit={buttonGit}
          buttonJupyter={this.props.buttonJupyter}
          body={this.props.error}
          lfsBadge={null}
        />
      );
    }

    if (this.props.file == null) {
      return (
        <Card>
          <CardHeader className="align-items-baseline">&nbsp;</CardHeader>
          <CardBody>{"Loading..."}</CardBody>
        </Card>
      );
    }

    const isLFS = this.props.hashElement ? this.props.hashElement.isLfs : false;
    const isLFSBadge = isLFS ? (
      <Badge className="lfs-badge" color="light">
        LFS
      </Badge>
    ) : null;

    const body = <FilePreview file={this.props.file} {...this.props} />;

    return (
      <FileCard
        gitLabUrl={this.props.externalUrl}
        filePath={this.props.filePath}
        commit={this.props.commit}
        buttonGraph={buttonGraph}
        buttonGit={buttonGit}
        buttonJupyter={this.props.buttonJupyter}
        body={body}
        lfsBadge={isLFSBadge}
      />
    );
  }
}

/**
 * Modes of showing notebook source code.
 */
const NotebookSourceDisplayMode = {
  DEFAULT: "DEFAULT",
  SHOWN: "SHOWN",
  HIDDEN: "HIDDEN",
};
/**
 * Modify the cell metadata according to the hidden policy
 *
 * @param {object} [cell] - The cell to process
 * @param {array} [accum] - The place to store the result
 */
function tweakCellMetadataHidden(cell, accum) {
  const clone = { ...cell };
  clone.metadata = { ...cell.metadata };
  clone.metadata.hide_input = true;
  accum.push(clone);
}

/**
 * Modify the cell metadata according to the show policy
 *
 * @param {object} [cell] - The cell to process
 * @param {array} [accum] - The place to store the result
 */
function tweakCellMetadataShow(cell, accum) {
  const clone = { ...cell };
  clone.metadata = { ...cell.metadata };
  clone.metadata.hide_input = false;
  accum.push(clone);
}

/**
 * Modify the cell metadata according to the default policy
 *
 * @param {object} [cell] - The cell to process
 * @param {array} [accum] - The place to store the result
 */
function tweakCellMetadataDefault(cell, accum) {
  if (cell.metadata.jupyter == null) {
    accum.push(cell);
  }
  else {
    const clone = { ...cell };
    clone.metadata = { ...cell.metadata };
    clone.metadata.hide_input = clone.metadata.jupyter.source_hidden;
    accum.push(clone);
  }
}

/**
 * Modify the notebook metadata so it is correctly processed by the renderer.
 *
 * @param {object} [nb] - The notebook to process
 * @param {string} [displayMode] - The mode to use to process the notebook
 */
function tweakCellMetadata(nb, displayMode = NotebookSourceDisplayMode.DEFAULT) {
  // Scan the cell metadata, and, if jupyter.source_hidden === true, set hide_input = true
  const result = { ...nb };
  result.cells = [];
  const cellMetadataFunction =
    displayMode === NotebookSourceDisplayMode.DEFAULT
      ? tweakCellMetadataDefault
      : displayMode === NotebookSourceDisplayMode.HIDDEN ?
        tweakCellMetadataHidden
        : tweakCellMetadataShow;
  nb.cells.forEach((cell) => cellMetadataFunction(cell, result.cells));
  if (displayMode === NotebookSourceDisplayMode.SHOWN) {
    // Set the hide_input to false;
    result["metadata"] = { ...result["metadata"] };
    result["metadata"]["hide_input"] = false;
  }
  return result;
}

function StyledNotebook(props) {
  const [displayMode, setDisplayMode] = useState(NotebookSourceDisplayMode.DEFAULT);

  if (props.notebook == null) return <div>Loading...</div>;

  const notebook = tweakCellMetadata(props.notebook, displayMode);
  return [
    <ListGroup key="controls" flush>
      <ListGroupItem>
        <div>
          <span>
            <b>Code Visibility &nbsp;</b>
          </span>
          <ButtonGroup key="controls" size="sm">
            <Button
              color="primary"
              onClick={() => setDisplayMode(NotebookSourceDisplayMode.DEFAULT)}
              active={displayMode === NotebookSourceDisplayMode.DEFAULT}
            >
              Default
            </Button>
            <Button
              color="primary"
              onClick={() => setDisplayMode(NotebookSourceDisplayMode.SHOWN)}
              active={displayMode === NotebookSourceDisplayMode.SHOWN}
            >
              Visible
            </Button>
            <Button
              color="primary"
              onClick={() => setDisplayMode(NotebookSourceDisplayMode.HIDDEN)}
              active={displayMode === NotebookSourceDisplayMode.HIDDEN}
            >
              Hidden
            </Button>
          </ButtonGroup>
        </div>
      </ListGroupItem>
    </ListGroup>,
    <NotebookPreview key="notebook" defaultStyle={false} loadMathjax={false} notebook={notebook} />,
  ];
}

class JupyterButtonPresent extends React.Component {
  render() {
    if (!this.props.access)
      return <CheckNotebookIcon fetched={true} launchNotebookUrl={this.props.launchNotebookUrl} />;

    if (this.props.updating) return <Loader size="16" inline="true" />;

    return (
      <CheckNotebookStatus
        client={this.props.client}
        model={this.props.model}
        scope={this.props.scope}
        launchNotebookUrl={this.props.launchNotebookUrl}
        filePath={this.props.filePath}
      />
    );
  }
}

export { StyledNotebook, JupyterButtonPresent, ShowFile, tweakCellMetadata, NotebookSourceDisplayMode };
