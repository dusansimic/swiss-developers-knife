# Serve the prebuilt static site with nginx.
# The `dist/` directory must be built (`pnpm build`) before building this image.
FROM docker.io/library/nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/ /usr/share/nginx/html/

EXPOSE 80
