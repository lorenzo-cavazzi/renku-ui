import { projectCloudStorageEmptyApi as api } from "./projectCloudStorage.empty-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getStorageByStorageId: build.query<
      GetStorageByStorageIdApiResponse,
      GetStorageByStorageIdApiArg
    >({
      query: (queryArg) => ({ url: `/storage/${queryArg.storageId}` }),
    }),
    putStorageByStorageId: build.mutation<
      PutStorageByStorageIdApiResponse,
      PutStorageByStorageIdApiArg
    >({
      query: (queryArg) => ({
        url: `/storage/${queryArg.storageId}`,
        method: "PUT",
        body: queryArg.body,
      }),
    }),
    patchStorageByStorageId: build.mutation<
      PatchStorageByStorageIdApiResponse,
      PatchStorageByStorageIdApiArg
    >({
      query: (queryArg) => ({
        url: `/storage/${queryArg.storageId}`,
        method: "PATCH",
        body: queryArg.body,
      }),
    }),
    deleteStorageByStorageId: build.mutation<
      DeleteStorageByStorageIdApiResponse,
      DeleteStorageByStorageIdApiArg
    >({
      query: (queryArg) => ({
        url: `/storage/${queryArg.storageId}`,
        method: "DELETE",
      }),
    }),
    getStorage: build.query<GetStorageApiResponse, GetStorageApiArg>({
      query: (queryArg) => ({
        url: `/storage`,
        params: { storage_params: queryArg.storageParams },
      }),
    }),
    postStorage: build.mutation<PostStorageApiResponse, PostStorageApiArg>({
      query: (queryArg) => ({
        url: `/storage`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    getStorageSchema: build.query<
      GetStorageSchemaApiResponse,
      GetStorageSchemaApiArg
    >({
      query: () => ({ url: `/storage_schema` }),
    }),
    postStorageSchemaValidate: build.mutation<
      PostStorageSchemaValidateApiResponse,
      PostStorageSchemaValidateApiArg
    >({
      query: (queryArg) => ({
        url: `/storage_schema/validate`,
        method: "POST",
        body: queryArg.rCloneConfigValidate,
      }),
    }),
    postStorageSchemaTestConnection: build.mutation<
      PostStorageSchemaTestConnectionApiResponse,
      PostStorageSchemaTestConnectionApiArg
    >({
      query: (queryArg) => ({
        url: `/storage_schema/test_connection`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
    postStorageSchemaObscure: build.mutation<
      PostStorageSchemaObscureApiResponse,
      PostStorageSchemaObscureApiArg
    >({
      query: (queryArg) => ({
        url: `/storage_schema/obscure`,
        method: "POST",
        body: queryArg.body,
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as projectCloudStorageGeneratedApi };
export type GetStorageByStorageIdApiResponse =
  /** status 200 Found the cloud storage */ CloudStorageGetRead;
export type GetStorageByStorageIdApiArg = {
  /** the id of the storage */
  storageId: Ulid;
};
export type PutStorageByStorageIdApiResponse =
  /** status 201 The cloud storage entry was created */ CloudStorageGetRead;
export type PutStorageByStorageIdApiArg = {
  /** the id of the storage */
  storageId: Ulid;
  body: CloudStorage | CloudStorageUrl;
};
export type PatchStorageByStorageIdApiResponse =
  /** status 201 The cloud storage entry was created */ CloudStorageGetRead;
export type PatchStorageByStorageIdApiArg = {
  /** the id of the storage */
  storageId: Ulid;
  body: CloudStoragePatch;
};
export type DeleteStorageByStorageIdApiResponse =
  /** status 204 The rcloud storage was removed or did not exist in the first place */ void;
export type DeleteStorageByStorageIdApiArg = {
  /** the id of the storage */
  storageId: Ulid;
};
export type GetStorageApiResponse =
  /** status 200 the storage configurations for the project */ CloudStorageGetRead[];
export type GetStorageApiArg = {
  /** query parameters */
  storageParams?: {
    project_id?: GitlabProjectId;
  };
};
export type PostStorageApiResponse =
  /** status 201 The cloud storage entry was created */ CloudStorageGetRead;
export type PostStorageApiArg = {
  body: CloudStorage | CloudStorageUrl;
};
export type GetStorageSchemaApiResponse =
  /** status 200 The cloud storage schema definition */ RCloneSchema;
export type GetStorageSchemaApiArg = void;
export type PostStorageSchemaValidateApiResponse =
  /** status 204 The configuration is valid */ void;
export type PostStorageSchemaValidateApiArg = {
  rCloneConfigValidate: RCloneConfigValidate;
};
export type PostStorageSchemaTestConnectionApiResponse =
  /** status 204 The configuration is valid */ void;
export type PostStorageSchemaTestConnectionApiArg = {
  body: {
    configuration: RCloneConfig;
    source_path: SourcePath;
  };
};
export type PostStorageSchemaObscureApiResponse =
  /** status 200 The config with password values obscured */ RCloneConfig;
export type PostStorageSchemaObscureApiArg = {
  body: {
    configuration: RCloneConfig;
  };
};
export type GitlabProjectId = string;
export type Ulid = string;
export type ProjectId = {
  project_id: GitlabProjectId | Ulid;
};
export type StorageType = string;
export type StorageTypeRead = string;
export type StorageName = string;
export type RCloneConfig = {
  [key: string]: number | (string | null) | boolean | object;
};
export type CloudStorage = ProjectId & {
  storage_type?: StorageType;
  name: StorageName;
  configuration: RCloneConfig;
  /** the source path to mount, usually starts with bucket/container name */
  source_path: string;
  /** the target path relative to the repository where the storage should be mounted */
  target_path: string;
  /** Whether this storage should be mounted readonly or not */
  readonly?: boolean;
};
export type CloudStorageRead = ProjectId & {
  storage_type?: StorageTypeRead;
  name: StorageName;
  configuration: RCloneConfig;
  /** the source path to mount, usually starts with bucket/container name */
  source_path: string;
  /** the target path relative to the repository where the storage should be mounted */
  target_path: string;
  /** Whether this storage should be mounted readonly or not */
  readonly?: boolean;
};
export type CloudStorageWithId = CloudStorage & {
  storage_id: Ulid;
};
export type CloudStorageWithIdRead = CloudStorageRead & {
  storage_id: Ulid;
};
export type RCloneOption = {
  /** name of the option */
  name: string;
  /** help text for the option */
  help: string;
  /** The cloud provider the option is for (See 'provider' RCloneOption in the schema for potential values) */
  provider?: string;
  /** default value for the option */
  default: number | string | boolean | object | any;
  /** string representation of the default value */
  default_str: string;
  /** These list potential values for this option, like an enum. With `exclusive: true`, only a value from the list is allowed. */
  examples?: {
    /** a potential value for the option (think enum) */
    value: string;
    /** help text for the value */
    help: string;
    /** The provider this value is applicable for. Empty if valid for all providers. */
    provider?: string;
  }[];
  /** whether the option is required or not */
  required: boolean;
  /** whether the field is a password (use **** for display) */
  ispassword: boolean;
  /** whether the value is sensitive (not stored in the service). Do not send this in requests to the service. */
  sensitive: boolean;
  /** whether this is an advanced config option (probably don't show these to users) */
  advanced: boolean;
  /** if true, only values from 'examples' can be used */
  exclusive: boolean;
  /** data type of option value. RClone has more options but they map to the ones listed here. */
  type:
    | "int"
    | "bool"
    | "string"
    | "Time"
    | "Duration"
    | "MultiEncoder"
    | "SizeSuffix"
    | "SpaceSepList"
    | "CommaSepList"
    | "Tristate"
    | "Encoding"
    | "Bits";
};
export type CloudStorageGet = {
  storage: CloudStorageWithId;
  sensitive_fields?: RCloneOption[];
};
export type CloudStorageGetRead = {
  storage: CloudStorageWithIdRead;
  sensitive_fields?: RCloneOption[];
};
export type ErrorResponse = {
  error: {
    code: number;
    detail?: string;
    message: string;
  };
};
export type CloudStorageUrl = ProjectId & {
  storage_url: string;
  name: StorageName;
  /** the target path relative to the repository where the storage should be mounted */
  target_path: string;
  /** Whether this storage should be mounted readonly or not */
  readonly?: boolean;
};
export type SourcePath = string;
export type CloudStoragePatch = {
  project_id?: GitlabProjectId | Ulid;
  storage_type?: StorageType;
  name?: StorageName;
  configuration?: RCloneConfig;
  source_path?: SourcePath;
  /** the target path relative to the repository where the storage should be mounted */
  target_path?: string;
  /** Whether this storage should be mounted readonly or not */
  readonly?: boolean;
};
export type CloudStoragePatchRead = {
  project_id?: GitlabProjectId | Ulid;
  storage_type?: StorageTypeRead;
  name?: StorageName;
  configuration?: RCloneConfig;
  source_path?: SourcePath;
  /** the target path relative to the repository where the storage should be mounted */
  target_path?: string;
  /** Whether this storage should be mounted readonly or not */
  readonly?: boolean;
};
export type RCloneEntry = {
  /** Human readable name of the provider */
  name: string;
  /** description of the provider */
  description: string;
  /** Machine readable name of the provider */
  prefix: string;
  /** Fields/properties used for this storage. */
  options: RCloneOption[];
};
export type RCloneSchema = RCloneEntry[];
export type RCloneConfigValidate = {
  [key: string]: number | (string | null) | boolean | object;
};
export const {
  useGetStorageByStorageIdQuery,
  usePutStorageByStorageIdMutation,
  usePatchStorageByStorageIdMutation,
  useDeleteStorageByStorageIdMutation,
  useGetStorageQuery,
  usePostStorageMutation,
  useGetStorageSchemaQuery,
  usePostStorageSchemaValidateMutation,
  usePostStorageSchemaTestConnectionMutation,
  usePostStorageSchemaObscureMutation,
} = injectedRtkApi;
