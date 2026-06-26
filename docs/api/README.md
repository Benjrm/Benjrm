# API-related documentation

## OpenAPI Specification (OAS)
- Industry-standard format (a YAML or JSON file) for describing RESTFUL APIs.
- Defines our API's endpoints, parameters, request/response formats, and more.
- Acts as a machine-readable contract between our API and its consumers.
- Because it is machine-readable, it can be used to automatically generate
  documentation (like *Swagger UI*), client and server code (like *Swagger Codegen*) and even test cases (like *Dredd*).

### Swagger
- Refers to the tooling ecosystem (like Swagger UI, Swagger Editor, and Swagger Codegen)
  that helps you design, visualize, and interact with APIs based on that spec.

#### API documentation with *Swagger UI*

1. Every API endpoint is documented within the [OpenAPI Specification (OAS)](../openapispec/RestInterface.yaml)

2. OpenAPI Specification (OAS) can be previewed in IDEs either by using a plugin to visualize the
   OAS in an interactive format directly or by previewing the `index.html` file in the `docs/openapispec/` directory,
   which is generated using Swagger UI and references the OAS file.

3. Swagger UI displays the OpenAPI Specification (OAS) in an interactive format
   and gets automatically deployed to GitHub Pages when the `main` branch is updated *and* files *either*
   in the `docs/openapispec/**` directory *or* the workflow file `.github/workflows/openapispec.yaml` are changed.

You can find the currently deployed version of the OpenAPI Specification (OAS) in an interactive format using Swagger UI [here](https://benjrm.github.io/Benjrm)

> For further details on how the OpenAPI Specification (OAS) is deployed to GitHub Pages in an interactive format using
> Swagger UI, please refer to the [GitHub Actions workflow file](../../.github/workflows/githubpages.yaml).

## AsyncAPI

The WebSockets used for live sessions are documented in [WebSockets.yaml](../asyncapi/WebSockets.yaml) using AsyncAPI.

### Generate HTML

run in `docs/asyncapi`:

```bash
npm install -g @asyncapi/cli
asyncapi generate fromTemplate WebSockets.yaml @asyncapi/html-template@3.5.6 -o <OUTPUT_PATH>
```

## Spectral
- A JSON/YAML linter with out of the box support for OpenAPI 3.x & 2.0 specifications
- Refer to the [Spectral documentation](https://docs.stoplight.io/docs/spectral/674b27b261c3c-overview) for more details,
especially the [OpenAPI ruleset](https://docs.stoplight.io/docs/spectral/4dec24461f3af-open-api-rules)

### Run locally

Ensure that you have installed the [Spectral CLI client](https://docs.stoplight.io/docs/spectral/9ffa04e052cc1-spectral-cli) globally using npm before running the following commands:
```bash
npm install -g @stoplight/spectral-cli
```

#### OpenAPI spec

run in `docs/openapispec`:
```bash
spectral lint RestInterface.yaml --fail-severity warn
```

#### AsyncAPI

run in `docs/asyncapi`:
```bash
spectral lint WebSockets.yaml --fail-severity warn
```

### Integrated into CI-Pipeline
Spectral - an open-source API style guide enforcer and linter - is integrated into the CI pipeline.
It runs on every pull request and pushes to main branch modifying either the [OpenAPI specification (OAS)](../openapispec/RestInterface.yaml), the [AsyncAPI](../asyncapi/WebSockets.yaml)
or the [workflow file itself](../../.github/workflows/spectral.yaml).

> For further details on how Spectral in integrated into the CI pipeline, please refer to
> the [GitHub Actions workflow file](../../.github/workflows/spectral.yaml).

After pushing to a pull request you can review the Spectral linting results in the "Files changed" tab, especially 
in the files `docs/openapispec/RestInterface.yaml` and `docs/asyncapi/WebSockets.yaml`
or in the "Checks" tab under the "Run Spectral on Pull Requests" workflow.

## Development

### Dummy Login Endpoint
In [#38](https://github.com/Benjrm/Benjrm/pull/38), a dummy login endpoint was introduced for development and debugging purposes. This endpoint is only available in debug builds and is not included in release builds.

When performing a GET request to `/auth/login/dummy/{id}`, where `{id}` is a placeholder for a dummy ID, the endpoint will log the user in as `dummy_user_{id}` (e.g. via `/auth/login/dummy/0` as `dummy_user_0`), creating or fetching the corresponding database user and establishing a session. It is useful for simplifying local development workflows and testing with tools like Postman or Bruno, where full authentication flows are unnecessary.

After a successful request, the user is not redirected and must manually navigate to the desired page or route. This endpoint is strictly for local development and can't be used in production environments.

## API-first development with *Schemathesis*

Schemathesis ensures that our API implementation matches our OpenAPI or GraphQL schema by automatically generating property-based tests and uncovering edge cases and inconsistencies early.

In general, *Schemathesis* automatically generates property-based tests from our
OpenAPI or GraphQL schema and exercises the edge cases that break our API.

For detailed documentation please refer to [Schemathesis' official documentation](https://schemathesis.readthedocs.io/en/stable/).

### Integrated into CI-Pipeline
1. GitHub Actions tests the API with *Schemathesis* when you create
   a *pull request* modifying *either* the [OpenAPI Specification](../openapispec), the
   [API implementation itself](../../backend) or the corresponding [workflow file](../../.github/workflows/schemathesis.yaml).

> For further details on how the *Schemathesis* GitHub Action works,
> please refer to the [GitHub Actions workflow file](../../.github/workflows/schemathesis.yaml).

2. Each run generates multiple coverage reports including a **PR comment** and an **HTML report** uploaded as a workflow artifact.
   Moreover, a summary in the Actions step log is also provided.

### Local testing
1. Installing [Pipenv](https://pipenv.pypa.io/en/latest/installation.html).
2. Running `pipenv update` in the `api_tests` directory to lock and install the dependencies.
3. Run `pipenv shell` to spawn a shell within the virtual environment.
4. Run `schemathesis run ../docs/openapispec/RestInterface.yaml --exclude-tag SchemathesisSkip`

### Limitations of Schemathesis

When creating a session using `POST /api/v1/sessions`, the API allows a quiz id in the body to directly create a session with a quiz. But OpenAPI spec does not support links pointing into the body of a request, so there is no way to tell Schemathesis to insert a valid quiz id there. Simply ignoring this would mean that Schemathesis would never create a session with a quiz and therefore would never be able to test the route `GET /api/v1/sessions/{session}/quiz`. To allow Schemathesis to test this route, the operations from `/api/v1/sessions` can also be performed on the path `/api/v1/quizzes/{quizId}/sessions`. This way Schemathesis can insert the quiz id into the path instead of the body.

Logically, it would be enough to only add `POST /api/v1/quizzes/{quizId}/sessions`, but Schemathesis can't understand the CRUD-relationships if the create path is `/api/v1/quizzes/{quizId}/sessions` and the read, update and delete path is `/api/v1/sessions/{session}`. This causes Schemathesis to first test read, update and delete and then test create.
