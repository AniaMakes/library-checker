import puppeteer from "puppeteer";
import fetchHardcoverTBR from "./hardcover-api/fetchToBeReadList.js";
import tidyHardcoverOutput from "./hardcover-api/tidyHardcoverOutput.js";
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

// async function checkLibrary() {
// 	// Navigate the page to a URL.
// 	await page.goto("https://col.ent.sirsidynix.net.uk/client/en_GB/default/#");

// 	// Set screen size.
// 	await page.setViewport({ width: 1080, height: 1024 });

// 	for (let i = 0; i < bookList.length; i++) {
// 		// inputs the search term into the search box
// 		const oneItem = bookList[i];
// 		const searchBox = `[id="q"]`;
// 		await page.locator(searchBox).fill(oneItem.title);
// 		await page.keyboard.press("Enter");

// 		// allows console logs to surface for debugging
// 		page.on("console", (consoleObj) => console.log(consoleObj.text()));

// 		let results;

// 		try {
// 			// find out which selector surfaces first
// 			// https://github.com/puppeteer/puppeteer/issues/709
// 			const raceSelectors = (page, selectors) => {
// 				return Promise.race(
// 					selectors.map((selector) => {
// 						return page
// 							.waitForSelector(selector, {
// 								visible: true,
// 							})
// 							.then(() => selector);
// 					}),
// 				);
// 			};

// 			const selector = await raceSelectors(page, [
// 				".results_cell",
// 				".no_results_wrapper",
// 			]);

// 			// if there are no results, report that back, then go to the next book
// 			if (selector === ".no_results_wrapper") {
// 				bookList[i].barbican = "no match found";
// 				continue;
// 			}

// 			// wait for secondary info to fetch and make sure network is idle before proceeding
// 			await page.waitForSelector(".detailItemTable");
// 			await page.waitForNetworkIdle();

// 			// gets result "cards"
// 			results = await page.$$eval(
// 				".results_cell",
// 				function (results, oneItem) {
// 					const searchResults = [];
// 					// console.log("authorSurname", oneItem.authorSurname);
// 					results.forEach(async function (result) {
// 						const innerText = result.innerText;

// 						// only run the scraper on results that match the author as the search results can unrelated
// 						if (innerText.includes(oneItem.authorSurname)) {
// 							const id = result.id.replace("results_cell", "");

// 							const originalSearchOutput = result.innerText;
// 							let finalOutput;

// 							// remove not useful info
// 							const clean1SearchOutput = originalSearchOutput.replace(
// 								"\nAdd To My Lists\nPreview\nPlace Hold",
// 								"",
// 							);
// 							const clean2SearchOutput = clean1SearchOutput.replace(
// 								"\nAdd To My Lists\nPlace Hold",
// 								"",
// 							);
// 							const clean3SearchOutput = clean2SearchOutput.replace(
// 								"\nAdd To My Lists",
// 								"",
// 							);

// 							finalOutput = clean3SearchOutput;

// 							// if the format is a physical book, get info which library it's at and the section name
// 							if (innerText.includes("Format:  Books")) {
// 								const tableId = `#detailItemTableCust${id}`;
// 								const tableItself = document.querySelector(".detailItemTable");

// 								const rows = tableItself.getElementsByClassName(
// 									"detailItemsTableRow",
// 								);

// 								let bookHardcopies = "";
// 								for (let i = 0; i < rows.length; i++) {
// 									const libraryName = rows[i].getElementsByClassName(
// 										"detailItemsTable_LIBRARY",
// 									);
// 									const shelfName = rows[i].getElementsByClassName(
// 										"detailItemsTable_CALLNUMBER",
// 									);
// 									const statusName = rows[i].getElementsByClassName(
// 										"detailItemsTable_SD_ITEM_STATUS",
// 									);

// 									const output = `${libraryName[0].innerText.replace("Searching...", "")} ${shelfName[0].innerText} ${statusName[0].innerText.replace("Searching...", "")}`;
// 									bookHardcopies += `\n${output}`;
// 								}

// 								finalOutput = clean3SearchOutput.concat(bookHardcopies);
// 							}
// 							searchResults.push(finalOutput);
// 						}
// 					});

// 					return searchResults;
// 					// https://stackoverflow.com/questions/62083537/puppeteer-iterate-div-and-then-from-result-iterate-child-element#comment138204360_62088370
// 					// You can't push to an array defined outside of the evaluate callback, because evaluate's callback is serialized and executed in the browser environment, not in Node. result needs to be defined inside the evaluate callback, then returned from the evaluate callback and assigned to a variable in Node.
// 				},
// 				oneItem,
// 			);
// 		} catch (error) {
// 			console.log(error);
// 		}

// 		bookList[i].barbican = results;

// 		// be kind, don't spam them with requests, wait 5s before each
// 		const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
// 		await sleep(5000);
// 	}
// }

// checkLibrary();

await checkCityOfLondon(page, bookList);
console.log(JSON.stringify(bookList));
await browser.close();
