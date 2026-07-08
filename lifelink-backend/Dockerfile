# Build Stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml and resolve dependencies first (caches dependencies in Docker layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and package application
COPY src ./src
RUN mvn clean package -DskipTests

# Run Stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy the generated JAR file
COPY --from=build /app/target/lifelink-backend-0.0.1-SNAPSHOT.jar app.jar

# Expose ports:
# - 8080: Web Application + API Server
# - 8082: Standalone Database Console
EXPOSE 8080
EXPOSE 8082

# Run the unified application
ENTRYPOINT ["java", "-jar", "app.jar"]
