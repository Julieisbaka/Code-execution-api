FROM gcc:14.1.0
WORKDIR /code
COPY main.cpp ./
RUN g++ main.cpp -o main
CMD ["./main"]
