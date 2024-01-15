const http = require("http");
const fs = require("fs");
const url = require("url");

const port = 8000;
const YEAR_OF_ADVENTURE = 2941;
const host = 'localhost';

const dwarfs = require('./data/data.json');
const dwarfsHashmap = dwarfs.reduce((result, el) => {
  result[el.id] = {...el};
  return result;
}, {});

const requestListener = function (req, res) {

  switch (true) {
    case /quiz/.test(req.url):
      res.setHeader("Content-Type", "application/json");
      res.writeHead(200);
      res.end(`{"id": ${randomIntFromInterval(0, dwarfs.length-1)}}`);
      break
    case /check_answer/.test(req.url):
      if (req.method !== "POST") {
        res.writeHead(405);
        res.end('HTTP Method Not Allowed');
      } else {
        calculateSuccess(req, res);
      }
      break
    case /.svg/.test(req.url):
      const urlParts = url.parse(req.url, true);
      loadDwarfPic(
        urlParts.query.id,
        (svgString) => {serveSvg(svgString, res)},
        (err) => onError(err, res));
      break
    default:
      res.writeHead(404);
      res.end(JSON.stringify({error:"Page not found"}));
  }
};

function randomIntFromInterval(min, max) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function loadDwarfPic(dwarfId, callback, onErrorCallback) {
  fs.readFile(__dirname+'/public/'+dwarfId+'.svg', "utf-8", (err, data) => {
    if (err) {
      onErrorCallback(new Error("FILE_NOT_FOUND"));
    } else {
      callback(data.toString());
    }
  })
}

function serveSvg(svgString, res) {
  res.writeHead(200);
  res.end(svgString);
}

function onError(err, res) {
  res.writeHead(500);
  res.end(`{"error": ${err}`);
}

function procedePost(req, res, callback) {
  if (req.method == 'POST') {
    let jsonString = '';

    req.on('data', function (data) {
      jsonString += data;
    });

    req.on('end', function () {
      callback(JSON.parse(jsonString));
    });
  }
}
function calculateSuccess(req, res) {
  procedePost(req, res, (answer) => {
    const correctAge = dwarfsHashmap[answer.id].yearOfBirth
      ? YEAR_OF_ADVENTURE - dwarfsHashmap[answer.id].yearOfBirth:
      'unknown';

    const answerAge = isNaN(parseInt(answer.age)) ? answer.age.toLowerCase() : +answer.age;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (answer.name === dwarfsHashmap[answer.id].name && answerAge === correctAge) {
      res.end(`{"success": 1}`);
    } else {
      res.end(`{"success": 0}`);
    }
  })
}

const server = http.createServer(requestListener);

server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
