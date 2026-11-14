# 1) build do front (React)
FROM node:20-alpine AS web
WORKDIR /web
COPY frontend/package.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# 2) build da API (.NET)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS api
WORKDIR /src
COPY backend/Api/Api.csproj Api/
RUN dotnet restore Api/Api.csproj
COPY backend/Api/ Api/
RUN dotnet publish Api/Api.csproj -c Release -o /out

# 3) imagem final: API + front estático + banco SQLite em /app/data
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=api /out .
COPY --from=web /web/dist ./wwwroot
RUN mkdir -p /app/data && chmod 777 /app/data
ENV ConnectionStrings__Default="Data Source=/app/data/chateval.db"
EXPOSE 8080
ENTRYPOINT ["dotnet", "Api.dll"]
