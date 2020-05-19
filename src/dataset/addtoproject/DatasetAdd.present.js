/*!
 * Copyright 2020 - Swiss Data Science Center (SDSC)
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
 *  renku-ui
 *
 *  DatasetAdd.present.js
 *  Presentational components.
 */


import React from "react";
import { Row, Col, Modal, ModalHeader, ModalBody } from "reactstrap";
import { FormPanel } from "../../utils/formgenerator";

function DatasetAdd(props) {

  return (
    <Modal
      isOpen={props.modalOpen}
      toggle={props.closeModal}
    >
      <ModalHeader toggle={props.closeModal}>
        Add dataset to project
      </ModalHeader>
      <ModalBody>
        <Row className="mb-3">
          <Col>
            <FormPanel
              btnName={"Add dataset"}
              submitCallback={props.submitCallback}
              model={props.addDatasetToProjectSchema}
              serverErrors={props.serverErrors}
              submitLoader={{ value: props.submitLoader, text: props.submitLoaderText }}
              onCancel={props.closeModal} />
          </Col>
        </Row>
      </ModalBody>
    </Modal>
  );

}

export default DatasetAdd;