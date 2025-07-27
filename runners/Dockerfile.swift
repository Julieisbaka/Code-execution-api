FROM swift:5.10
WORKDIR /code
COPY main.swift ./
CMD ["swift", "main.swift"]
