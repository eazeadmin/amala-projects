# AMALA Projects: Plane Community Edition with AMALA Agency branding.
# Built on Plane's official all-in-one image, so upgrading is just a rebuild.
FROM makeplane/plane-aio-community:stable

USER root
COPY . /opt/amala-src
RUN mkdir -p /opt/amala-brand/assets \
 && cd /opt/amala-src \
 && cp apply_branding.py brand.css brand.js /opt/amala-brand/ \
 && cp *.png *.ico *.gif /opt/amala-brand/assets/ \
 && python3 /opt/amala-brand/apply_branding.py \
 && rm -rf /opt/amala-src
