FROM ruby:3.3-alpine
WORKDIR /usr/src/app
COPY code.rb ./
COPY Gemfile ./
RUN if [ -f Gemfile ]; then bundle install; fi
ENTRYPOINT ["ruby", "code.rb"]
