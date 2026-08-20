FROM nginx:1.28-alpine

COPY cloud-run/default.conf.template /etc/nginx/templates/default.conf.template
COPY *.html *.css *.js *.svg *.webmanifest robots.txt sitemap.xml /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets

EXPOSE 8080
