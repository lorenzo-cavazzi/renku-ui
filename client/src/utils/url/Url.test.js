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
 *  Url.test.js
 *  Tests for Url.
 */

import { UrlRules } from "./Url";


describe("UrlRules class", () => {
  it("Initialization values and errors", () => {
    // Verify all the parameters, and try to trigger all possible errors based on wrong parameters.
    let rule;

    // output
    expect(() => new UrlRules("wrong_type"))
      .toThrow("required <output> parameter must be a function");
    rule = new UrlRules(() => "/");
    expect(rule.output).toBeInstanceOf(Function);
    expect(rule.data).toBeInstanceOf(Array);
    expect(rule.data).toHaveLength(0);

    // data
    expect(() => new UrlRules(() => "/", "wrong_type"))
      .toThrow("<data> parameter must be an array");
    expect(() => new UrlRules(() => "/", ["input1", "input2"]))
      .toThrow("<output> function must have an argument to assign the data");
    expect(() => new UrlRules(() => "/", ["input1", 21]))
      .toThrow("<data> parameter must contain only strings");
    rule = new UrlRules((data) => "/", ["input1", "input2"]);
    expect(rule.data).toBeInstanceOf(Array);
    expect(rule.data).toHaveLength(2);

    // validation
    expect(() => new UrlRules((data) => "/", ["input1", "input2"], "wrong_type"))
      .toThrow("optional <validation> parameter must be a function");
    rule = new UrlRules((data) => "/", ["input1", "input2"], (data) => true);
    expect(rule.validation).toBeInstanceOf(Function);

    // examples
    expect(() => new UrlRules(() => "/", [], null, "wrong_type"))
      .toThrow("optional <examples> parameter must be an array");
    expect(() => new UrlRules(() => "/", [], null, ["input1", 21]))
      .toThrow("<examples> parameter must contain only strings");
    rule = new UrlRules(() => "/", [], null, ["/", "/test"]);
    expect(rule.examples).toBeInstanceOf(Array);
    expect(rule.examples).toHaveLength(2);
  });

  it("Methods", () => {
    // Create static rule.
    let rule;
    rule = new UrlRules(() => "/");
    expect(rule.get()).toBe("/");

    // Create dynamic rule without validation.
    rule = new UrlRules((data) => `/${data.param1}/something`, ["param1"]);
    expect(rule.get({ param1: "test" })).toBe("/test/something");
    expect(() => rule.get({ wrongParam: "test" })).not.toThrow();
    expect(rule.get({ wrongParam: "test" })).not.toBe("/test/something");

    // Create dynamic rule with validation.
    rule = new UrlRules(
      (data) => `/${data.param1}/something`,
      ["param1"],
      (data) => { if (!data.param1) throw new Error("You must specify <param1>"); return true; }
    );
    expect(() => rule.get({ wrongParam: "test" })).toThrow();
    expect(rule.get({ param1: "test" })).toBe("/test/something");
  });

  it("Realistic rule example", () => {
    // Create a realistic rule.
    const projectValidation = (data) => {
      if (!data.namespace)
        throw new Error("Project path requires a <namespace>.");
      else if (!data.path)
        throw new Error("Project path requires a <path>.");
      return true;
    };
    const rule = new UrlRules(
      (data) => `/projects/${data.namespace}/${data.path}`,
      ["namespace", "path"],
      projectValidation,
      ["/projects/fake-user/fake-project"]
    );

    // Verify single properties and try to manually invoke functions.
    expect(rule.output).toBeInstanceOf(Function);
    expect(rule.data).toBeInstanceOf(Array);
    expect(rule.data).toHaveLength(2);
    expect(rule.validation).toBeInstanceOf(Function);
    expect(rule.examples).toBeInstanceOf(Array);
    expect(rule.examples).toHaveLength(1);
    expect(rule.examples[0]).toBe("/projects/fake-user/fake-project");

    const data = { namespace: "fake-user", path: "fake-project" };
    expect(() => rule.validation({})).toThrow();
    expect(() => rule.validation(data)).not.toThrow();
    expect(rule.output(data)).toBe(rule.examples[0]);
    expect(rule.output({})).not.toBe(rule.examples[0]);

    // Compare with the `get` method.
    expect(rule.get(data)).toBe(rule.examples[0]);
    expect(() => rule.get({})).toThrow();
  });
});
