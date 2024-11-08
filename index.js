const net = require('node:net');
const { URL } = require('node:url');
var { Readability } = require('@mozilla/readability');
const axios = require('axios');
var { JSDOM } = require('jsdom');
const fs = require('fs');
const readline = require('readline');
const { stringify } = require("csv-stringify");
const writableStream = fs.createWriteStream("results.csv");

const columns = [
  "url",
  "site_name",
  "article_title",
  "article_byline",
  "article_publish_date",
  "language",
];
const stringifier = stringify({ header: true, columns: columns });

function process_url(url) {
	console.log(url)
    axios.get(url).then((response) => {
       document = new JSDOM(response.data);
       var article = new Readability(document.window.document).parse();
       stringifier.write([url, 
	       article.siteName !== null ? article.siteName: "",
	       article.title !== null ? article.title : "",
	       article.byline !== null ? article.byline : "",
	       article.publishedDate !== null ? article.publishedDate : "",
	       article.lang !== null ? article.lang : ""]);
    }).catch((e) => {}); 
}

const file = readline.createInterface({
    input: fs.createReadStream('urls.txt'),
    output: process.stdout,
    terminal: false
});

file.on('line', (line) => {
    process_url(line);
});

stringifier.pipe(writableStream);
