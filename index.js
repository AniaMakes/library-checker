import puppeteer from "puppeteer";
import fetchHardcoverTBR from "./hardcover-api/fetchToBeReadList.js";
import tidyHardcoverOutput from "./hardcover-api/tidyHardcoverOutput.js";
import checkCambridgeshire from "./libraries/UK/cambridgeshire.js";
import checkCityOfLondon from "./libraries/UK/cityOfLondon.js";

// const books = await fetchHardcoverTBR();
// const tidyHardcoverData = tidyHardcoverOutput(books);

const bookList = [
	{ title: "Katabasis", authorSurname: "Kuang" },
	{ title: "The binding", authorSurname: "Collins" },
];

// const bookList = tidyHardcoverData;

// Open browser window / page
const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();

await checkCambridgeshire(page, bookList);
console.log(JSON.stringify(bookList));
await browser.close();
