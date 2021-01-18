/*!
 * Copyright 2021 - Swiss Data Science Center (SDSC)
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
 *  Url.js
 *  Url helper class.
 */

/** Class to represent a set of rules to derive a specific URL */
class UrlRules {
  /**
   * Create a set of rules. The constructor also validates the parameters and throw exceptions whenever necessary.
   *
   * @param {function} output - function to derive the relative URL. If any data is required, it must have one
   *   argument, used to assign the data object.
   * @param {string[]} [data] - array of strings corresponding to the required members of the data object, if any.
   * @param {function} [validation] - function to validate the data parameters. Must return `true` to succeed. Throw
   *   meaningful errors otherwise.
   * @param {string[]} examples - a list of valid urls. Useful as a reference for the developers, especially when
   *   the output function consumes a lots of data parameters.
   */
  constructor(output, data = [], validation = null, examples = []) {
    // check data
    if (!Array.isArray(data))
      throw new Error("The <data> parameter must be an array.");
    else if (data.some(v => typeof v !== "string"))
      throw new Error("The <data> parameter must contain only strings representing the required data fields.");
    else
      this.data = data;

    // check output
    if (typeof output !== "function")
      throw new Error("The required <output> parameter must be a function.");
    else if (data.length && output.length !== 1)
      throw new Error("The <output> function must have an argument to assign the data, since they are required.");
    else
      this.output = output;

    // check validation
    if (validation) {
      if (typeof validation !== "function")
        throw new Error("The optional <validation> parameter must be a function.");
      else
        this.validation = validation;
    }

    // check examples
    if (examples) {
      if (!Array.isArray(examples))
        throw new Error("The optional <examples> parameter must be an array.");
      else if (examples.some(v => typeof v !== "string"))
        throw new Error("The <examples> parameter must contain only strings representing valid URLs.");
      else
        this.examples = examples;
    }
  }

  /**
   * Get the url given the data parameters, where required
   *
   * @param {object} [data] - context data for the url creation
   */
  get(data = {}) {
    // check data
    if (this.validation) {
      const valid = this.validation(data);
      if (!valid) {
        const functionCode = this.validation.toString();
        throw new Error(`Invalid data, reason unspecified. You can inspect the validation function: ${functionCode}`);
      }
    }

    // create and return final url
    return this.output(data);
  }
}


/** Helper class to handle URLs */
class Url {
  static rules = {

  };

  static pages = {

  }

  /**
  * Create a Url based on the target page. Depending on the specific page, it may require context data.
  *
  * @param {object} target - the page you are targeting, as contained in the `pages` static member
  *   (e.g. pages.landing, pages.project.stats, ...).
  * @param {object} [data] - the context data you need to provide, if any
  *   (e.g. for project, you need to provide a `namespace` and a `path`).
  * @param {boolean} [full] - switch between full or relative path. The default is `false`.
  */
  static get(target, data, full = false) {
    return null;
  }
}

export { Url };

// testing only
export { UrlRules };
