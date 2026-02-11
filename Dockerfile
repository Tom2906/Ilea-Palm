# Multi-stage build: Frontend (Node) + Backend (.NET) in a single container
# Serves React SPA from wwwroot/ and API on /api/*
# Connects to external PostgreSQL (Supabase)

# --- Stage 1: Build frontend ---
FROM node:22-alpine AS frontend-build
WORKDIR /src/frontend

COPY employee-hub-ui/package.json ./
RUN npm install && node -e "require.resolve('@dnd-kit/core')"

COPY employee-hub-ui/ ./
RUN npx vite build

# --- Stage 2: Build API ---
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api-build
WORKDIR /src/api

COPY EmployeeHub.Api/EmployeeHub.Api.csproj ./
RUN dotnet restore

COPY EmployeeHub.Api/ ./
RUN dotnet publish -c Release -o /app/publish

# --- Stage 3: Runtime ---
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=api-build /app/publish ./
COPY --from=frontend-build /src/frontend/dist ./wwwroot/

# Non-root user for security
USER $APP_UID

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "EmployeeHub.Api.dll"]
