# Stage 1: Build the application
FROM gradle:8.14-jdk21 AS build

# Set working directory
WORKDIR /app

# Copy gradle configuration files
COPY build.gradle settings.gradle ./
COPY gradle ./gradle

# Create gradle.properties with optimized settings
RUN echo "org.gradle.parallel=true" > gradle.properties && \
    echo "org.gradle.caching=true" >> gradle.properties && \
    echo "org.gradle.daemon=false" >> gradle.properties && \
    echo "org.gradle.configureondemand=true" >> gradle.properties

# Trigger dependency resolution with optimized settings
RUN --mount=type=cache,target=/root/.gradle gradle dependencies

# Copy source code
COPY src ./src

# Build the application with optimized settings
RUN --mount=type=cache,target=/root/.gradle gradle bootJar

# Stage 2: Run the application
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy the built JAR file from the build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Expose the port the app runs on
EXPOSE 8080

ADD https://github.com/jwilder/dockerize/releases/download/v0.6.1/dockerize-linux-amd64-v0.6.1.tar.gz /tmp/
RUN tar -C /usr/local/bin -xzvf /tmp/dockerize-linux-amd64-v0.6.1.tar.gz && \
    rm /tmp/dockerize-linux-amd64-v0.6.1.tar.gz

ENTRYPOINT ["dockerize", "-wait", "tcp://user-svc-db:5432", "-timeout", "60s", "java", "-jar", "app.jar"]
