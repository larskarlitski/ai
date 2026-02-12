FROM fedora-minimal:42

RUN dnf install -y nodejs jq && dnf clean all

COPY ./lib /usr/local/libexec/ai/lib
COPY ./bin /usr/local/libexec/ai/bin

RUN ln -s /usr/local/libexec/ai/bin/ai /usr/local/bin/ai
