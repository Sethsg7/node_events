// Complete Events Exercise
const { EventEmitter } = require("events");
const http = require("http");
const path = require("node:path");
const fs = require("fs");
const port = 3000;

const newsLetter = new EventEmitter();

newsLetter.on("signup", (contact) => {
  fs.appendFile(
    "./newsletter.csv",
    `${contact.name}, ${contact.email}\n`,
    (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`Added ${contact.name} to the newsletter list.`);
      }
    }
  );
});

http
  .createServer((req, res) => {
    const { url, method } = req;

    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      if (req.url == "/newsletter_signup" && req.method == "POST") {
        let body = Buffer.concat(chunks).toString();
        let parsedBody;

        try {
          parsedBody = JSON.parse(body);
        } catch (error) {
          res.writeHead(400, { "Content-Type": "application/JSON" });
          res.write({
            msg: "You did not provide the correct request body details.",
          });
          res.end();
        }

        newsLetter.emit("signup", parsedBody);
        res.writeHead(404, { "Content-Type": "text/html" });
        res.write(JSON.stringify({ msg: "Thanks for signing up!" }));
        res.end();
      } else if (
        url == "/newsletter_signup" ||
        (url == "/" && method == "GET")
      ) {
        let filePath = url == "/" ? "./index.html" : "./newsletter_signup.html";
        fs.readFile(filePath, (err, contents) => {
          let response = contents,
            contentType = "text/html",
            status = 200;

          if (err) {
            console.error(err);
            status = 500;
            response = "<h1>Server Error</h1>";
          }
          res.writeHead(status, { "Content-Type": contentType });
          res.write(response);
          res.end();
        });
      } else if (url == "/api/newsletter" && method == "GET") {
        fs.readFile("./newsletter.csv", (err, contents) => {
          if (err) {
            console.error(err);
            res.writeHead(500, { "Content-Type": "application/JSON" });
            res.write(
              JSON.stringify({ msg: "Server failed to read newsletter file." })
            );
            res.end();
          } else {
            let list = contents
              .toString()
              .split("\n")
              .map((record) => {
                let [name, email] = record.split(",");
                return { name, email };
              });

            res.writeHead(200, { "Content-Type": "application/JSON" });
            res.write(JSON.stringify(list));
            res.end();
          }
        });
      } else {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.write("<h1>404 Page Not Found</h1>");
        res.end();
      }
    });
  })
  .listen(port, () => console.log(`Server running on port ${port}.`));
