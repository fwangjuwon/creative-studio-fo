FROM nsm-cloud-registry.nsmall.com/nsm-images/nginx:1.25.5
RUN mkdir -p /var/log/nginx && chown -R nginx:nginx /var/log/nginx