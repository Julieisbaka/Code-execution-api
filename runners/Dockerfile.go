FROM golang:1.22-alpine
WORKDIR /code
COPY main.go ./
RUN go build -o main main.go
CMD ["./main"]
