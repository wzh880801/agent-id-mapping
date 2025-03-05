FROM node:18.20.4
RUN mkdir /repos
RUN mkdir /repos/agent-id-mapping
COPY . /repos/agent-id-mapping
WORKDIR /repos/agent-id-mapping
RUN npm i pm2@latest -g --registry=https://registry.npmmirror.com/
RUN npm i --registry=https://registry.npmmirror.com/
RUN chmod +x ./start.sh
ENTRYPOINT [ "./start.sh" ]