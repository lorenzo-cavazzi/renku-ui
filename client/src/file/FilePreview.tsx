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

import hljs from "highlight.js";
import React from "react";
import { CardBody } from "reactstrap";
import { Document, Page } from "react-pdf/dist/esm/entry.webpack";
import DOMPurify from "dompurify";

import "react-pdf/dist/esm/Page/AnnotationLayer.css";

import { FileNoPreview, StyledNotebook } from "./File.present";
import { atobUTF8 } from "../utils/helpers/Encoding";
import { encodeImageBase64 } from "../components/markdown/RenkuMarkdownWithPathTranslation";
import { RenkuMarkdown } from "../components/markdown/RenkuMarkdown";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "tiff", "gif", "svg"];
const CODE_EXTENSIONS = [
  "bat", "cwl", "dcf", "ini", "jl", "job", "js", "json", "m", "mat", "parquet", "prn", "py", "r", "rmd",
  "rout", "rproj", "rs", "rst", "scala", "sh", "toml", "ts", "xml", "yaml", "yml",
  "c", "cc", "cxx", "cpp", "h", "hh", "hxx", "hpp", // C++
  "f", "for", "ftn", "fpp", "f90", "f95", "f03", "f08" // Fortran
];
/* eslint-disable */
const TEXT_EXTENSIONS = ["csv",
  "dockerignore", "gitattributes", "gitkeep", "gitignore", "renkulfsignore", "txt"
];
/* eslint-enable */

type HashElement = {isLfs: boolean};

function filenameExtension(filename: string | undefined) {
  if (!filename)
    return null;

  if (filename.match(/\.(.*)/) === null)
    return null;
  const extension = filename.split(".").pop();
  return extension?.toLowerCase() ?? null;
}

type FileType = "code" | "image" | "ipynb" | "lfs" | "md" | "none" | "pdf" | "text" | "unknown";
function fileInfoToType(hashElement?: HashElement, filename?: string): FileType {
  // This needs to be checked first
  if (hashElement && hashElement.isLfs) return "lfs";

  if (!filename) return "unknown";

  const ext = filenameExtension(filename);
  if (ext == null) return "none";
  if ("pdf" === ext) return "pdf";
  if ("md" === ext) return "md";
  if ("ipynb" === ext) return "ipynb";
  if (IMAGE_EXTENSIONS.indexOf(ext) >= 0) return "image";
  if (TEXT_EXTENSIONS.indexOf(ext) >= 0) return "text";
  if (CODE_EXTENSIONS.indexOf(ext) >= 0) return "code";


  return "unknown";
}

type FilePreviewProps = {
  branch: string,
  client: unknown,
  downloadLink: string,
  file?: {content: string, file_name: string, file_path: string, size: number},
  hashElement?: HashElement,
  insideProject: boolean,
  previewThreshold: {hard: number, soft: number},
  projectId: string,
  projectPathWithNamespace: string
}

function FilePreview(props: FilePreviewProps) {
  const [previewAnyway, setPreviewAnyway] = React.useState(false);
  const fileType = fileInfoToType(props.hashElement, props.file?.file_name);
  const fileIsCode = "code" === fileType;

  // File has not yet been fetched
  if (!props.file) return null;


  const getFileExtension = () => filenameExtension(props.file?.file_name);

  // LFS files and big files
  if ("lfs" === fileType || (props.previewThreshold &&
      props.file.size > props.previewThreshold.soft && !previewAnyway)) {
    return (
      <FileNoPreview
        url={props.downloadLink}
        lfs={true}
        softLimit={props.previewThreshold.soft}
        softLimitReached={props.file.size > props.previewThreshold.soft}
        hardLimit={props.previewThreshold.hard}
        hardLimitReached={props.file.size > props.previewThreshold.hard}
        previewAnyway={previewAnyway}
        loadAnyway={setPreviewAnyway}
      />
    );
  }

  // Various types of images
  if ("image" === fileType) {
    return (
      <CardBody key="file preview" className="bg-white">
        <img
          className="image-preview"
          alt={props.file.file_name}
          src={encodeImageBase64(props.file.file_name, props.file.content)}
        />
      </CardBody>
    );
  }

  // pdf document
  if ("pdf" === fileType) {
    return (
      <CardBody key="file preview" className="pb-0 bg-white">
        <PDFViewer file={`data:application/pdf;base64,${props.file.content}`}/>
      </CardBody>
    );
  }

  // Free text
  if ("text" === fileType) {
    return (
      <CardBody key="file preview" className="pb-0 bg-white">
        <pre className="no-highlight">
          <code>{atobUTF8(props.file.content)}</code>
        </pre>
      </CardBody>
    );
  }

  // Markdown
  if ("md" === fileType) {
    let content = atobUTF8(props.file.content);
    return (
      <CardBody key="file preview" className="pb-0 bg-white">
        <RenkuMarkdown
          projectPathWithNamespace={props.projectPathWithNamespace}
          filePath={props.file.file_path}
          markdownText={content}
          projectId={props.projectId}
          fixRelativePaths={props.insideProject}
          branch={props.branch}
          client={props.client}
        />{" "}
      </CardBody>
    );
  }

  // Jupyter Notebook
  if ("ipynb" === fileType) {
    return (
    // Do not wrap in a CardBody, the notebook container does that itself
      <JupyterNotebookContainer
        key="notebook-body"
        notebook={JSON.parse(atobUTF8(props.file.content))}
        filePath={props.file.file_path}
        {...props}
      />
    );
  }

  // Code with syntax highlighting
  if (fileIsCode) {
    return (
      <CardBody key="file preview" className="pb-0 bg-white">
        <CodePreview content={props.file.content} fileExtension={getFileExtension()!} />
      </CardBody>
    );
  }

  // No extensions
  if ("none" === fileType) {
    return (
      <CardBody key="file preview" className="pb-0 bg-white">
        <pre className={"hljs bg-white"}>
          <code>{atobUTF8(props.file.content)}</code>
        </pre>
      </CardBody>
    );
  }

  // File extension not supported
  return (
    <CardBody key="file preview" className="pb-0 bg-white">
      <p>{`Unable to preview file with extension .${getFileExtension()}`}</p>
    </CardBody>
  );
}

/* eslint-disable */
// See https://github.com/highlightjs/highlight.js/blob/main/SUPPORTED_LANGUAGES.md
const hljsNameMap: Record<string, string> = {
  "jl": "julia",
  "f": "fortran",
  "for": "fortran",
  "ftn": "fortran",
  "fpp": "fortran",
  "f03": "fortran",
  "f08": "fortran",
  "m": "objectivec",
  "mat": "matlab",
};
/* eslint-enable */
function extensionToHljsName(ext: string) {
  return hljsNameMap[ext] ?? ext;
}

type CodePreviewProps = {
  content: string,
  fileExtension: string
}

function CodePreview(props: CodePreviewProps) {
  const codeBlock = React.useRef<HTMLPreElement>(null);
  React.useEffect(() => {
    if (codeBlock.current) {
      codeBlock.current.innerHTML = DOMPurify.sanitize(codeBlock.current.innerHTML);
      hljs.highlightBlock(codeBlock.current);
    }
  }, [codeBlock]);

  const languageName = extensionToHljsName(props.fileExtension);

  return (
    <pre ref={codeBlock} className={`hljs language-${languageName} bg-white`}>
      {atobUTF8(props.content)}
    </pre>
  );
}

type JupyterNotebookContainerProps = {
  client: unknown,
  filePath: string,
  notebook: unknown
}

function JupyterNotebookContainer(props: JupyterNotebookContainerProps) {
  let filePath = props.filePath;
  if (filePath && filePath[0] !== "/") filePath = "/" + filePath;
  const notebookProps = {
    fileName: props.filePath.replace(/^.*(\\|\/|:)/, ""),
    notebook: props.notebook,
    client: props.client
  };
  // Implemented this way to keep TS happy
  return <StyledNotebook {...notebookProps} />;
}

type PdfViewerProps = {
  file: string,
}

export function PDFViewer(props: PdfViewerProps) {
  const [numPages, setNumPages] = React.useState<number|undefined>(undefined);

  function onDocumentLoadSuccess({ numPages }: {numPages: number}) {
    setNumPages(numPages);
  }

  return (
    <Document
      file={props.file}
      onLoadSuccess={onDocumentLoadSuccess}
      renderMode="svg">
      {
        Array.from(
          new Array(numPages),
          (el, index) => (
            <Page
              className="rk-pdf-page"
              key={`page_${index + 1}`}
              pageNumber={index + 1}
            />
          ),
        )
      }
    </Document>
  );
}


export default FilePreview;
