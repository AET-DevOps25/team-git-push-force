# Concepter

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Environment Configuration

The application supports multiple environments:

- **Development**: Uses `environment.ts` (default for local development)
- **Staging**: Uses `environment.staging.ts` (for the staging environment)
- **Production**: Uses `environment.prod.ts` (for the production environment)

## Building with Docker

The Dockerfile supports building the application for different environments using the `BUILD_ENV` build argument.

### Building for Production (default)

```bash
docker build -t client .
```

This will use the production environment configuration by default.

### Building for Staging

```bash
docker build -t client --build-arg BUILD_ENV=staging .
```

This will use the staging environment configuration.

### Building for Development

```bash
docker build -t client --build-arg BUILD_ENV=development .
```

This will use the development environment configuration.

## Environment Configuration Files

The environment configuration files are located in `src/environments/`:

- `environment.ts`: Development environment
- `environment.staging.ts`: Staging environment
- `environment.prod.ts`: Production environment

Each file contains environment-specific settings like API URLs and feature flags.

## CI/CD Integration

The project's CI/CD pipeline automatically sets the appropriate `BUILD_ENV` value based on the Git branch:

- **main branch**: Uses `BUILD_ENV=production` for production deployments
- **dev branch**: Uses `BUILD_ENV=staging` for staging deployments
- **other branches**: Uses `BUILD_ENV=development` as a fallback

This is implemented in the GitHub Actions workflow (`.github/workflows/ci.yml`), which automatically builds and deploys the application with the correct environment configuration.

### Manual CI/CD Example

For manual CI/CD integration, you can use the `BUILD_ENV` build argument to specify the target environment:

```yaml
# Example for staging deployment
docker build -t client --build-arg BUILD_ENV=staging .

# Example for production deployment
docker build -t client --build-arg BUILD_ENV=production .
```

This ensures that the correct environment configuration is used for each deployment target.
