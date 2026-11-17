# AMALA Projects: Plane Community Edition with AMALA Agency branding.
# Built on Plane's official all-in-one image, so upgrading is just a rebuild.
FROM makeplane/plane-aio-community:stable

USER root
COPY brand /opt/amala-brand
RUN python3 /opt/amala-brand/apply_branding.py
