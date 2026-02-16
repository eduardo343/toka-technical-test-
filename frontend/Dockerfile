FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_AUTH_API_URL
ARG VITE_USER_API_URL
ARG VITE_ROLE_API_URL
ARG VITE_AUDIT_API_URL

ENV VITE_AUTH_API_URL=${VITE_AUTH_API_URL}
ENV VITE_USER_API_URL=${VITE_USER_API_URL}
ENV VITE_ROLE_API_URL=${VITE_ROLE_API_URL}
ENV VITE_AUDIT_API_URL=${VITE_AUDIT_API_URL}

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
