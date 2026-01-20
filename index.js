import puppeteer from "puppeteer";
import fetchHardcoverTBR from "./hardcover-api/fetchToBeReadList.js";
import tidyHardcoverOutput from "./hardcover-api/tidyHardcoverOutput.js";

const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();

async function checkLibrary() {
	const books = await fetchHardcoverTBR();
	const tidyHardcoverData = tidyHardcoverOutput(books);

	// Navigate the page to a URL.
	await page.goto("https://col.ent.sirsidynix.net.uk/client/en_GB/default/#");

	// Set screen size.
	await page.setViewport({ width: 1080, height: 1024 });

	let allBookListOutput = [];
	const title = "Katabasis";
	const authorSurname = "Kuang";

	//   const bookList = [
	//     { title: "Katabasis", authorSurname: "Kuang" },
	//     { title: "The binding", authorSurname: "Collins" },
	//   ];

	const bookList = tidyHardcoverData;
	// const oneItem = bookList[0]

	for (let i = 0; i < bookList.length; i++) {
		// =======
		const oneItem = bookList[i];
		const searchBox = `[id="q"]`;
		await page.locator(searchBox).fill(oneItem.title);
		await page.keyboard.press("Enter");

		page.on("console", (consoleObj) => console.log(consoleObj.text()));

		const resultsBox = '[id="results_wrapper"]';

		// find class results_cell
		// const data = await page.evaluate(() => {
		// 	let divs = [...document.querySelectorAll('.results_cell')];
		// 	const output = divs.map(div => {
		// 		return div.innerText;
		// 	})
		// 	console.log(output)
		// })

		let results;
		// ---
		try {
			// https://github.com/puppeteer/puppeteer/issues/709
			const raceSelectors = (page, selectors) => {
				return Promise.race(
					selectors.map((selector) => {
						return page
							.waitForSelector(selector, {
								visible: true,
							})
							.then(() => selector);
					}),
				);
			};

			const selector = await raceSelectors(page, [
				".results_cell",
				".no_results_wrapper",
			]);

			if (selector === ".no_results_wrapper") {
				bookList[i].barbican = "no match found";
				continue;
			}

			//   await page.waitForSelector(".results_cell");
			await page.waitForSelector(".detailItemTable");
			await page.waitForNetworkIdle();

			// if no results "No results found in Search Results.\nSwitch to next category."
			// in searchResults_wrapper

			results = await page.$$eval(
				".results_cell",
				function (results, oneItem) {
					const searchResults = [];
					// console.log("authorSurname", oneItem.authorSurname);
					results.forEach(async function (result) {
						const innerText = result.innerText;

						if (innerText.includes(oneItem.authorSurname)) {
							const id = result.id.replace("results_cell", "");

							const originalSearchOutput = result.innerText;
							let finalOutput;

							// remove not useful info
							const clean1SearchOutput = originalSearchOutput.replace(
								"\nAdd To My Lists\nPreview\nPlace Hold",
								"",
							);
							const clean2SearchOutput = clean1SearchOutput.replace(
								"\nAdd To My Lists\nPlace Hold",
								"",
							);
							const clean3SearchOutput = clean2SearchOutput.replace(
								"\nAdd To My Lists",
								"",
							);

							finalOutput = clean3SearchOutput;

							if (innerText.includes("Format:  Books")) {
								const tableId = `#detailItemTableCust${id}`;
								const tableItself = document.querySelector(".detailItemTable");

								const rows = tableItself.getElementsByClassName(
									"detailItemsTableRow",
								);
								// console.log("rows", rows);

								let bookHardcopies = "";
								for (let i = 0; i < rows.length; i++) {
									const libraryName = rows[i].getElementsByClassName(
										"detailItemsTable_LIBRARY",
									);
									const shelfName = rows[i].getElementsByClassName(
										"detailItemsTable_CALLNUMBER",
									);
									const statusName = rows[i].getElementsByClassName(
										"detailItemsTable_SD_ITEM_STATUS",
									);

									const output = `${libraryName[0].innerText.replace("Searching...", "")} ${shelfName[0].innerText} ${statusName[0].innerText.replace("Searching...", "")}`;
									bookHardcopies += `\n${output}`;
									// console.log("output", output);
								}

								finalOutput = clean3SearchOutput.concat(bookHardcopies);
							}
							// console.log(finalOutput);
							searchResults.push(finalOutput);
						}
					});

					return searchResults;
					// https://stackoverflow.com/questions/62083537/puppeteer-iterate-div-and-then-from-result-iterate-child-element#comment138204360_62088370
					// You can't push to an array defined outside of the evaluate callback, because evaluate's callback is serialized and executed in the browser environment, not in Node. result needs to be defined inside the evaluate callback, then returned from the evaluate callback and assigned to a variable in Node.
				},
				oneItem,
			);
		} catch (error) {
			console.log(error);
		}

		bookList[i].barbican = results;
		const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
		await sleep(5000);

		// const singleBookOutput = {
		//   ...oneItem,
		//   results,
		// };

		// allBookListOutput.push(singleBookOutput);
		// console.log('================')
		// console.log("results", results);
		// console.log('================')

		// =======
	}

	console.log(bookList);
	// ---

	// WORKS for single item
	// await page.waitForSelector('.results_cell')
	// const result = await page.$eval('.results_cell', e => e.innerText);

	// console.log(result);
	await browser.close();

	// ---
}

// checkLibrary();
