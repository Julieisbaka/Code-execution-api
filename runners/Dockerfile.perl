FROM perl:5.40
WORKDIR /code
COPY main.pl ./
CMD ["perl", "main.pl"]
