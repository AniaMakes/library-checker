// Cambridgeshire 

/**
 * Scrapes data from the City Of London library catalogue.
 * @param page - Puppeteer page.
 * @param bookList - Array of objects
 */
export default async function checkCambridgeshire(browser, page, bookList) {
	// Navigate the page to a URL.
	await page.goto("https://cambridgeshire.spydus.co.uk/");

	// Set screen size.
	await page.setViewport({ width: 1080, height: 1024 });

	const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
	await sleep(1000);
	await page.waitForNetworkIdle();


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
				".result-content-records",
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

			const searchResults = await page.$$(".card-body");
			const searchResultOutput = [];

			for (const result of searchResults) {
				const innerText = await result.evaluate(node => node.innerText);

				// only run the scraper on results that match the author as the search results can unrelated
				if (innerText.includes(oneItem.authorSurname)) {

					const resultTitle = await result.$eval(".card-title", node => node.innerText);

					const resultAuthorAndYear = await result.$eval(".recdetails", function (node) {
						const nodeChildren = node.childNodes;
						const authorAndYearOutput = [];

						for (let nodes = 0; nodes < nodeChildren.length; nodes++) {
							authorAndYearOutput.push(node.childNodes[nodes].innerText)
						}
						return authorAndYearOutput
					});

					const availabilityLink = await result.$('[data-bs-target="#holdingsDlg"]')
					const availabilityLinkHref = await availabilityLink.evaluate(node => node.href)

					const availabilityPage = await browser.newPage();
					await availabilityPage.goto(availabilityLinkHref, { waitUntil: "networkidle2" });
					await page.waitForNetworkIdle();

					const rows = await availabilityPage.$$eval("tr", function (tableRows) {
						return tableRows.map(function (tableRow) {
							if ([...tableRow.querySelectorAll("td")].length) {
								return [...tableRow.querySelectorAll("td")].map(cell => cell.innerText).filter(data => data)
							}
						}).filter(row => row)
					})

					const finalOutputObject = {
						title: resultTitle,
						author: resultAuthorAndYear[0],
						year: resultAuthorAndYear[1]
					}

					const itemOutput = rows.map(function (row) {
						const rowOutput = {}

						if (row.includes("eBooks")) {
							rowOutput.format = "ebook";
							rowOutput.details = row[2]
							return rowOutput
						}

						if (row.includes("eAudio")) {
							rowOutput.format = "eaudiobook";
							rowOutput.details = row[2]
							return rowOutput
						}

						rowOutput.format = "physical book"
						rowOutput.bookDetails = {
							location: row[0],
							collection: row[1],
							callNumber: row[2],
							status: row[3],
						}


						return rowOutput
					})

					finalOutputObject.details = itemOutput;

					searchResultOutput.push(finalOutputObject);

					await availabilityPage.close()
				}
			}

			console.log('================')
			console.log("searchResultOutput", searchResultOutput);
			console.log('================')

		} catch (error) {
			console.log(error);
		}

		bookList[i].cambridgeshire = results;

		// be kind, don't spam them with requests, wait 5s before each
		const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
		await sleep(5000);
	}
}
