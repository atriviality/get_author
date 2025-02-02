const net = require("node:net");
const { URL } = require("node:url");
var { Readability } = require("@mozilla/readability");
const axios = require("axios");
var { JSDOM } = require("jsdom");
const fs = require("fs");
const readline = require("readline");
const { stringify } = require("csv-stringify");
const writableStream = fs.createWriteStream("results.csv");
const { ArgumentParser } = require("argparse");
const XLSX = require("xlsx");

const parser = new ArgumentParser({
  description: "Add article metadata to collected URLs",
});
parser.add_argument("data", { help: "XLSX spreadsheet to process for URLs" });
args = parser.parse_args();

const columns = [
  "url",
  "site_name",
  "article_title",
  "article_byline",
  "article_publish_date",
  "language",
  "content",
];
const stringifier = stringify({ header: true, columns: columns });
var results = undefined;

function process_url(url, count) {
  return axios.get(url, { timeout: 2000 });
}

async function read_file() {
  wb = XLSX.readFileSync(args.data, { cellDates: true });
  for (const sheet of wb.SheetNames) {
    wk = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1 });
    results = Array(wk.length);
    count = 0;
    for (const row of wk.slice(2)) {
      count += 1;
      try {
        if (row[1] !== undefined) {
          await (async () =>
            await process_url(row[1], count).then((response) => {
              document = new JSDOM(response.data);
              var article = new Readability(document.window.document).parse();
              try {
                results[count] = [
                  row[1],
                  article.siteName !== null ? article.siteName : "",
                  article.title !== null ? article.title : "",
                  article.byline !== null ? article.byline : "",
                  article.publishedDate !== null ? article.publishedDate : "",
                  article.lang !== null ? article.lang : "",
                  article.content !== null ? article.textContent.trim() : "",
                ];
              } catch (error) {
                results[count] = ["", "", "", "", "", ""];
              }
            }))();
        } else {
          results[count] = ["", "", "", "", "", ""];
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
}

function write_results() {
  for (const r of results) {
    try {
      if (r !== undefined) {
        stringifier.write(r);
      } else {
        stringifier.write(["", "", "", "", "", ""]);
      }
    } catch (error) {
      stringifier.write(["", "", "", "", "", ""]);
    }
  }
  stringifier.pipe(writableStream);
}
read_file().then(() => write_results());
//const file = readline.createInterface({
//    input: fs.createReadStream('urls.txt'),
//    output: process.stdout,
//    terminal: false
//});
//
//file.on('line', (line) => {
//    process_url(line);
//});
//
