FROM alpine:3.19

ARG PB_VERSION=0.23.4
ARG TARGETOS=linux
ARG TARGETARCH=amd64

RUN apk add --no-cache unzip ca-certificates wget

RUN wget -q \
    "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${TARGETOS}_${TARGETARCH}.zip" \
    -O /tmp/pocketbase.zip && \
    unzip /tmp/pocketbase.zip -d /pb && \
    rm /tmp/pocketbase.zip

COPY pb_migrations /pb/pb_migrations
COPY pb_public     /pb/pb_public

VOLUME /pb/pb_data

EXPOSE 8080

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080"]
