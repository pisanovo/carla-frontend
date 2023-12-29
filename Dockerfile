FROM node:lts-bullseye
WORKDIR /code
RUN corepack enable
COPY package.json package.json
COPY .yarnrc.yml .yarnrc.yml
COPY yarn.lock yarn.lock
COPY .yarn .yarn
RUN yarn
COPY . .
RUN yarn build
EXPOSE 3000
CMD ["yarn", "start"]
