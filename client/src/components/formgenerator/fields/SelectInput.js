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
 *  SelectInput.js
 *  Presentational components.
 */

import * as React from "react";
import FormLabel from "./FormLabel";
import { FormGroup, Input } from "reactstrap";
import { FormText } from "../../../utils/ts-wrappers";
import { ErrorLabel } from "../../formlabels/FormLabels";

function SelectInput(
  { name, label, type, value, alert, options, placeholder, setInputs, help, disabled = false, required = false }) {
  return <FormGroup className="field-group">
    <FormLabel htmlFor={name} label={label} required={required}/>
    <Input data-cy={`input-${name}`} id={name} name={name} type={type} value={value || ""}
      onChange={setInputs} placeholder={placeholder} disabled={disabled}>
      {options && options.map(option => <option key={option.value} value={option.value}>{option.name}</option>)}
    </Input>
    {help && <FormText color="muted">{help}</FormText>}
    {alert && <ErrorLabel text={alert} />}
  </FormGroup>;
}

export default SelectInput;