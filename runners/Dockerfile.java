FROM openjdk:21-jdk-alpine
WORKDIR /usr/src/app
COPY Main.java ./
RUN javac Main.java
ENTRYPOINT ["java", "Main"]
