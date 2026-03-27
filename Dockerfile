FROM nsm-cloud-registry.nsmall.com/nsm-images/nginx:1.25.5
COPY /dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]