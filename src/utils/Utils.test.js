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
 *  utils.test.js
 *  test fo utilities
 */

import Time from "./Time";
import { splitAutosavedBranches, sanitizedHTMLFromMarkdown, parseINIString } from "./HelperFunctions";

describe("Time class helper", () => {
  const Dates = {
    NOW: new Date(),
    UTCZ_STRING: "2019-03-11T09:34:51.000Z",
    INVALID: "this is not a date",
    ISO_READABLE_DATETIME: "2019-03-11 09:34:51",
    ISO_READABLE_DATETIME_SHORT: "2019-03-11 09:34",
    ISO_READABLE_DATE: "2019-03-11",
    ISO_READABLE_TIME: "09:34:51"
  };

  const DatesTimezoneFriendly = {
    Plus: {
      UTCZ_STRING: "2019-08-23T18:00:00.000Z",
      ISO_READABLE_DATETIME: "2019-08-23 18:00:00",
      ISO_READABLE_DATETIME_SHORT: "2019-08-23 18:00"
    },
    Minus: {
      UTCZ_STRING: "2019-08-23T06:00:00.000Z",
      ISO_READABLE_DATETIME: "2019-08-23 06:00:00",
      ISO_READABLE_DATETIME_SHORT: "2019-08-23 06:00",
    }
  };

  it("function isDate", () => {
    expect(Time.isDate(Dates.NOW)).toBeTruthy();
    expect(Time.isDate(Dates.UTCZ_STRING)).toBeFalsy();
    expect(Time.isDate(new Date(Dates.UTCZ_STRING))).toBeTruthy();
    expect(Time.isDate(Dates.INVALID)).toBeFalsy();
  });
  it("function parseDate", () => {
    expect(Time.parseDate(Dates.NOW)).toEqual(Dates.NOW);
    expect(Time.parseDate(Dates.UTCZ_STRING)).toEqual(new Date(Dates.UTCZ_STRING));
    expect(() => { Time.parseDate(Dates.INVALID); }).toThrow("Invalid date");
  });
  it("function toIsoString", () => {
    expect(Time.toIsoString(Dates.UTCZ_STRING)).toEqual(Dates.ISO_READABLE_DATETIME);
    expect(Time.toIsoString(Dates.UTCZ_STRING, "datetime")).toEqual(Dates.ISO_READABLE_DATETIME);
    expect(Time.toIsoString(Dates.UTCZ_STRING, "datetime-short")).toEqual(Dates.ISO_READABLE_DATETIME_SHORT);
    expect(Time.toIsoString(Dates.UTCZ_STRING, "date")).toEqual(Dates.ISO_READABLE_DATE);
    expect(Time.toIsoString(Dates.UTCZ_STRING, "time")).toEqual(Dates.ISO_READABLE_TIME);
    const fakeType = "not existing";
    expect(() => { Time.toIsoString(Dates.UTCZ_STRING, fakeType); }).toThrow(`Uknown type "${fakeType}"`);

    expect(Time.toIsoString(DatesTimezoneFriendly.Minus.UTCZ_STRING))
      .toEqual(DatesTimezoneFriendly.Minus.ISO_READABLE_DATETIME);
    expect(Time.toIsoString(DatesTimezoneFriendly.Minus.UTCZ_STRING))
      .toEqual(DatesTimezoneFriendly.Minus.ISO_READABLE_DATETIME);
  });
  it("function toIsoTimezoneString", () => {
    // Create the string manually. It's a creepy logic, but here string manipulation seems to be
    // a valid way to avoid re-writing function code in the test.
    const positive = (new Date().getTimezoneOffset()) >= 0 ?
      true :
      false;
    const DatesTimezone = positive ?
      DatesTimezoneFriendly.Plus :
      DatesTimezoneFriendly.Minus;
    const date = new Date(DatesTimezone.UTCZ_STRING);
    const deltaHours = Math.abs(parseInt(date.getTimezoneOffset() / 60));
    const deltaMinutes = Math.abs(date.getTimezoneOffset()) - (deltaHours * 60);
    let expectedString = DatesTimezone.ISO_READABLE_DATETIME;
    if (deltaHours) {
      let hour = parseInt(expectedString.substring(11, 13));
      if (positive) {
        hour = hour - deltaHours;
        if (deltaMinutes)
          hour--;
      }
      else {
        hour = hour + deltaHours;
      }
      let stringHour = `0${hour}`.substring(0, 2);
      expectedString = expectedString.substring(0, 11) + stringHour + expectedString.substring(13);
    }
    if (deltaMinutes) {
      let minute = parseInt(expectedString.substring(14, 16));
      minute = positive ?
        minute - deltaMinutes :
        minute + deltaMinutes;
      let stringMinute = `0${minute}`.substring(0, 2);
      expectedString = expectedString.substring(0, 14) + stringMinute + expectedString.substring(16);
    }
    expect(Time.toIsoTimezoneString(DatesTimezone.UTCZ_STRING)).toEqual(expectedString);
  });
});

describe("Ini file parser", () => {
  it("valid code", () => {
    // simple variable
    let content = "my_prop = abc";
    let parsedCode = parseINIString(content);
    // variables are parsed as key-value pairs and return in an object
    expect(Object.keys(parsedCode).length).toBe(1);
    expect(Object.keys(parsedCode)).toContain("my_prop");
    expect(parsedCode.my_prop).toBe("abc");

    // multiple variables
    content = `
    my_prop_1 = 1
    my_prop_2 = true`;
    parsedCode = parseINIString(content);
    expect(Object.keys(parsedCode).length).toBe(2);
    expect(Object.keys(parsedCode)).toContain("my_prop_1");
    expect(Object.keys(parsedCode)).toContain("my_prop_2");
    // note that values are not automatically converted
    expect(parsedCode.my_prop_1).toBe("1");
    expect(parsedCode.my_prop_1).not.toBe(1);
    expect(parsedCode.my_prop_2).toBe("true");
    expect(parsedCode.my_prop_2).not.toBe(true);

    // sections
    content = `
    [sub]
    my_prop = cde`;
    parsedCode = parseINIString(content);
    // variables in sections sections are parsed as sub-objects
    expect(Object.keys(parsedCode).length).toBe(1);
    expect(Object.keys(parsedCode)).toContain("sub");
    expect(Object.keys(parsedCode.sub).length).toBe(1);
    expect(Object.keys(parsedCode.sub)).toContain("my_prop");
    expect(parsedCode.sub.my_prop).toBe("cde");
  });
  it("invalid code", () => {
    // random string
    const content = "this is a random string";
    const parsedCode = parseINIString(content);
    // any valid string always returns an object
    expect(typeof parsedCode).toBe("object");
    expect(Object.keys(parsedCode).length).toBe(0);
  });
  it("partially valid code", () => {
    // sections
    const content = `
    valid_prop_1 = abc
    random_text
    123
    valid_prop_2 = def`;
    const parsedCode = parseINIString(content);
    // the function try to parse everything and leaves out simple errors
    expect(Object.keys(parsedCode).length).toBe(2);
    expect(Object.keys(parsedCode)).toContain("valid_prop_1");
    expect(Object.keys(parsedCode)).toContain("valid_prop_2");
    expect(Object.keys(parsedCode)).not.toContain("random_text");
    expect(Object.keys(parsedCode)).not.toContain("123");
    expect(parsedCode.valid_prop_1).toBe("abc");
    expect(parsedCode.valid_prop_2).toBe("def");
  });
  it("throwing code", () => {
    // any non-string will throw an exception
    const invalid_contents = [true, 12345, null, undefined, [], {}];
    invalid_contents.forEach(content => {
      // eslint-disable-next-line
      expect(() => { parseINIString(content); }).toThrow();
    });
  });
});

describe("Helper functions", () => {
  const branches = [
    { name: "master" },
    { name: "renku/autosave/myuser/master/1234567/890acbd" }
  ];

  it("function splitAutosavedBranches", () => {
    const splittedBranches = splitAutosavedBranches(branches);
    expect(splittedBranches.standard.length).toEqual(1);
    expect(splittedBranches.autosaved.length).toEqual(1);
    const [ namespace, branch, commit, finalCommit ] = branches[1].name.replace("renku/autosave/", "").split("/");
    expect(splittedBranches.autosaved[0].autosave.namespace).toEqual(namespace);
    expect(splittedBranches.autosaved[0].autosave.branch).toEqual(branch);
    expect(splittedBranches.autosaved[0].autosave.commit).toEqual(commit);
    expect(splittedBranches.autosaved[0].autosave.finalCommit).toEqual(finalCommit);
  });
});

describe("html sanitization", () => {
  it("handles empty markdown", () => {
    const markdown = "";
    const html = sanitizedHTMLFromMarkdown(markdown);
    expect(html).toEqual("");
  });

  it("handles pure markdown", () => {
    const markdown = "# internal-test\nA Renku project.\n\nThis is an *internal* project that is used for testing.";
    const html = sanitizedHTMLFromMarkdown(markdown);
    // eslint-disable-next-line
    expect(html).toEqual(`<h1 id="internal-test">internal-test</h1>\n<p>A Renku project.</p>\n<p>This is an <em>internal</em> project that is used for testing.</p>`);
  });

  it("handles mixed markdown", () => {
    const markdown = `# internal-test

A Renku project.

This is an *internal* project that is used for testing.

<div>
  This is some HTML in a div, since that is valid Markdown.
</div>

<div class="container-fluid">
  <div class="row">
    <div class="col-sm-8">
      An 8 unit column here on the left.
    </div>
    <div class="col-sm-4">
      A 4 unit column here on the right.
    </div>
  </div>
</div>`;
    const expected = `<h1 id="internal-test">internal-test</h1>
<p>A Renku project.</p>
<p>This is an <em>internal</em> project that is used for testing.</p>
<div>
  This is some HTML in a div, since that is valid Markdown.
</div>
<div class="container-fluid">
  <div class="row">
    <div class="col-sm-8">
      An 8 unit column here on the left.
    </div>
    <div class="col-sm-4">
      A 4 unit column here on the right.
    </div>
  </div>
</div>`;
    const html = sanitizedHTMLFromMarkdown(markdown);
    expect(html).toEqual(expected);
  });

  it("strips suspicious markdown", () => {
    const markdown = `# internal-test

A Renku project.

This is an *internal* project that is used for testing.

<div>
  This is some HTML in a div, since that is valid Markdown.
</div>

<div class="container-fluid">
  <div class="row">
    <div class="col-sm-8">
      An 8 unit column here on the left.
    </div>
    <div class="col-sm-4">
      A 4 unit column here on the right.
    </div>
  </div>
  <div class="row">
    <div class="col-sm-8">
      The following alerts should get sanitized away.
      <script>alert('xss');</script>
      hello <a name="n" href="javascript:alert('xss')">*you*</a>
    </div>
  </div>
</div>`;
    const expected = `<h1 id="internal-test">internal-test</h1>
<p>A Renku project.</p>
<p>This is an <em>internal</em> project that is used for testing.</p>
<div>
  This is some HTML in a div, since that is valid Markdown.
</div>
<div class="container-fluid">
  <div class="row">
    <div class="col-sm-8">
      An 8 unit column here on the left.
    </div>
    <div class="col-sm-4">
      A 4 unit column here on the right.
    </div>
  </div>
  <div class="row">
    <div class="col-sm-8">
      The following alerts should get sanitized away.
      \n      hello <a name="n">*you*</a>
    </div>
  </div>
</div>`;
    const html = sanitizedHTMLFromMarkdown(markdown);
    expect(html).toEqual(expected);
  });
});
