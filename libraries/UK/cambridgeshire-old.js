// Cambridgeshire pre-early-2026

/**
 * Scrapes data from the City Of London library catalogue.
 * @param page - Puppeteer page.
 * @param bookList - Array of objects
 */
export default async function checkCambridgeshire(page, bookList) {
	// Navigate the page to a URL.
	await page.goto("https://cambridgeshire.spydus.co.uk/");

	// Set screen size.
	await page.setViewport({ width: 1080, height: 1024 });

	const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
	await sleep(1000);

	// accept cookies
	const cookieButton = `#offcanvasCookie_req`;
	await page.click(cookieButton);

	for (let i = 0; i < bookList.length; i++) {
		// inputs the search term into the search box
		const oneItem = bookList[i];
		const searchBox = `[id="header-search-entry"]`;
		await page.locator(searchBox).fill(oneItem.title);
		await page.keyboard.press("Enter");

		// allows console logs to surface for debugging
		page.on("console", (consoleObj) => console.log(consoleObj.text()));

		let results;

		try {
			// find out which selector surfaces first
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
				"#result-content-list",
				".alert",
			]);

			// if there are no results, report that back, then go to the next book
			if (selector === ".alert") {
				bookList[i].cambridgeshire = "no match found";
				continue;
			}

			// wait for secondary info to fetch and make sure network is idle before proceeding
			// await page.waitForSelector(".detailItemTable");
			await page.waitForNetworkIdle();

			// gets result "cards"

			//TODO refactor so that results returns the list to puppeteer node process, do as much from within the node process, then get modal that way too

			results = await page.$$eval(
				".card-body",
				function (results, oneItem) {
					const searchResults = [];
					// console.log("authorSurname", oneItem.authorSurname);
					results.forEach(async function (result) {
						const innerText = result.innerText;

						// only run the scraper on results that match the author as the search results can unrelated
						if (innerText.includes(oneItem.authorSurname)) {
							const id = result.id.replace("results_cell", "");

							const originalSearchOutput = result.innerText;
							const resultTitle = result.querySelector(".card-title").innerText;
							const resultAuthorAndYear =
								result.querySelector(".recdetails").innerText;
							const resultFormat = result.querySelector(".recfrmt").innerText;

							let finalOutput;
							let finalOutputObject = {
								resultTitle,
								resultAuthorAndYear,
								format: resultFormat,
							};

							// if the format is a physical book, get info which library it's at and the section name
							if (resultFormat === "Books") {
								finalOutputObject.format = "physical book";

								// open availibility modal
								const viewAvailibilityDiv =
									result.querySelector(".availability");
								const viewAvailibilityLink =
									viewAvailibilityDiv.querySelector("a");
								viewAvailibilityLink.click();

								const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
								await sleep(5000);
								// const tableId = `#detailItemTableCust${id}`;
								// const tableItself = document.querySelector(".detailItemTable");
								const modalOutput = await page.eval$('.modal-content', function (modalResults) {
									console.log('================')
									console.log("modalResults", modalResults);
									console.log('================')
								})

								console.log("1");
								const tableItself = document.querySelectorAll("table"); // JSHandle@array
								console.log("2");
								// const answ = await tableItself.toElement('table')
								console.log("Array.fromAsync(tableItself)", Array.from(tableItself));
								console.log("3");

								// tableItself.evaluate((domElement) => {
								// 	console.log(domElement)
								// })
								console.log('================')
								console.log("answ", answ);
								console.log('================')

								const rows = tableItself?.querySelectorAll("tr");
								console.log('================')
								console.log("rows", rows);
								console.log('================')


								// let bookHardcopiesArray = [];
								for (let i = 0; i < rows.length; i++) {
									const libraryName = rows[i].querySelector(
										'[data-caption="Location"]',
									)
									const shelfName = rows[i].querySelector(
										'[data-caption="Collection"]',
									);

									const subjectName = rows[i].querySelector(
										'[data-caption="Call number"]',
									);

									const statusName = rows[i].querySelector(
										'[data-caption="Status/Desc"]',
									);

									const output = `${libraryName.innerText}`

									console.log('================')
									console.log("output", output);
									console.log('================')

									// const output = `${libraryName[0].innerText.replace("Searching...", "")} ${shelfName[0].innerText} ${statusName[0].innerText.replace("Searching...", "")}`;

									// 	bookHardcopiesArray.push(output);
								}

								// finalOutputObject.hardcopies = bookHardcopiesArray;

								// close availibility modal
								document.querySelector("#holdingsDlg").click();
							}

							searchResults.push(finalOutputObject);
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

		bookList[i].cambridgeshire = results;

		// be kind, don't spam them with requests, wait 5s before each
		const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
		await sleep(5000);
	}
}
