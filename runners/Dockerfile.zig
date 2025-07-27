FROM stagex/zig:0.12.0-alpine
WORKDIR /code
COPY main.zig ./
RUN zig build-exe main.zig
CMD ["./main"]
