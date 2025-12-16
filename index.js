import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({headless: false});
const page = await browser.newPage();


async function checkLibrary(){
	// Navigate the page to a URL.
	await page.goto('https://col.ent.sirsidynix.net.uk/client/en_GB/default/#');

	// Set screen size.
	await page.setViewport({width: 1080, height: 1024});

	const searchBox = `[id="q"]`;

	const bookName = "Katabasis"
	const bookAuthor = "Kuang"

	await page.locator(searchBox).fill(bookName);
	await page.keyboard.press('Enter');

	page.on("console", (consoleObj) => console.log(consoleObj.text()));

	const resultsBox = '[id="results_wrapper"]'

	// find class results_cell
	// const data = await page.evaluate(() => {
	// 	let divs = [...document.querySelectorAll('.results_cell')];	
	// 	const output = divs.map(div => {
	// 		return div.innerText;
	// 	})
	// 	console.log(output)
	// })

	// ---
		await page.waitForSelector('.results_cell')
		await page.waitForSelector('.detailItemTable');
		await page.waitForNetworkIdle();

			const results = await page.$$eval('.results_cell', function(results, bookAuthor){

			console.log("bookAuthor", bookAuthor);
			results.forEach(async function(result){
				const innerText = result.innerText;

				if(innerText.includes(bookAuthor)){
					const id = result.id.replace("results_cell", "");
					if(innerText.includes("Format:  Books")){
						const tableId = `#detailItemTableCust${id}`;
						const tableItself = document.querySelector('.detailItemTable');

						const rows = tableItself.getElementsByClassName('detailItemsTableRow')
						console.log("rows", rows);

						for (let i = 0; i < rows.length; i++){
							const libraryName = rows[i].getElementsByClassName('detailItemsTable_LIBRARY')
							const shelfName = rows[i].getElementsByClassName('detailItemsTable_CALLNUMBER')
							const statusName = rows[i].getElementsByClassName('detailItemsTable_SD_ITEM_STATUS')

							const output = `${libraryName[0].innerText.replace("Searching...", "")} ${shelfName[0].innerText} ${statusName[0].innerText.replace("Searching...", "")}`
							console.log("output", output);
						}
					}
					console.log(result.innerText)
				}

			
			})
// https://stackoverflow.com/questions/62083537/puppeteer-iterate-div-and-then-from-result-iterate-child-element#comment138204360_62088370
// You can't push to an array defined outside of the evaluate callback, because evaluate's callback is serialized and executed in the browser environment, not in Node. result needs to be defined inside the evaluate callback, then returned from the evaluate callback and assigned to a variable in Node.
			
		},
		bookAuthor
	)
	// ---

	// WORKS for single item
	// await page.waitForSelector('.results_cell')
	// const result = await page.$eval('.results_cell', e => e.innerText);

	// console.log(result);

	// --- 
}

checkLibrary();