/*!
 * Copyright 2019 - Swiss Data Science Center (SDSC)
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
 *  NotFound.present.js
 *  Presentational components for not-found
 */

import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Row, Col, Button } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

class NotFound extends Component {
  render() {
    return (
      <Row>
        <Col>
          <h1>Error 404</h1>
          <h3>
            Page not found <FontAwesomeIcon icon={faSearch} flip="horizontal" />
          </h3>
          <div>&nbsp;</div>
          <p>
            We could not find the page &quot;<i>{ this.props.match.url }</i>&quot; in our website.
          </p>
          <Link to="/">
            <Button color="primary">
              Back to home
            </Button>
          </Link>

        </Col>
      </Row>
    );
  }
}

export { NotFound };
