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

/**
 *  renku-ui
 *
 *  FormPanel.js
 *  Presentational components.
 */

import React from "react";
import { Form, Button, Col, UncontrolledAlert, FormText } from "reactstrap";
import useForm from "./UseForm";
import TextInput from "./fields/TextInput";
import TextareaInput from "./fields/TexAreaInput";
import SelectInput from "./fields/SelectInput";
import CktextareaInput from "./fields/CKEditorTextArea";
import FileuploaderInput from "./fields/FileUploaderInput";
import { Loader } from "../../utils/UIComponents";
import "./FormGenerator.css";

function FormPanel({ title, btnName, submitCallback, model, serverErrors, submitLoader, onCancel, edit }) {
  const modelValues = Object.values(model);
  const [inputs, setInputs, setSubmit] = useForm(modelValues, submitCallback);
  const Components = { TextInput, TextareaInput, CktextareaInput, FileuploaderInput, SelectInput };
  const capitalize = expression => expression.charAt(0).toUpperCase() + expression.slice(1);
  const renderInput = input => {
    const Component = Components[capitalize(input.type) + "Input"];
    return <Component key={input.name}
      disabled={submitLoader.value || (input.edit === false && edit)} setInputs={setInputs} {...input} />;
  };

  return (
    <Col>
      <h3 className="uk-heading-divider uk-text-center pb-2">{title}</h3>
      <Form onSubmit={setSubmit}>
        <div>
          {inputs.map(input => renderInput(input))}
          {serverErrors ? <UncontrolledAlert color="danger">{serverErrors}</UncontrolledAlert> : null}
          {submitLoader !== undefined && submitLoader.value ?
            <FormText color="primary">
              <Loader size="16" inline="true" margin="2" />
              {submitLoader.text}
            </FormText>
            : null
          }
          <Button type="submit" disabled={submitLoader.value} className="float-right mt-1" color="primary">
            {btnName}
          </Button>
          {
            onCancel !== undefined ?
              <Button disabled={submitLoader.value} className="float-right mt-1 mr-1"
                color="secondary" onClick={onCancel}>Cancel</Button>
              : null
          }
        </div>
      </Form>
    </Col>
  );
}

export default FormPanel;
