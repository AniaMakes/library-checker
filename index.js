import puppeteer from "puppeteer";
import dotenv from "dotenv";
dotenv.config();

// const browser = await puppeteer.launch({ headless: false });
// const page = await browser.newPage();

const query = `
query {
  me {
      id,
      username
		user_books(where: {status_id: {_eq: 1}}) {
      book {
        title
				contributions {
					author {
						name
					}
				}
				book_series{
						position
						series {
							name
						}
				}
				release_year
				release_date
				id
      }
    }
  }
}
`;

async function fetchHardcoverTBR() {
  try {
    const url = "https://api.hardcover.app/v1/graphql";
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.HARDCOVER_API_KEY,
        "User-Agent": "user-63581",
      },
      body: JSON.stringify({ query }),
      method: "POST",
    });
    if (!res.ok) {
      throw new Error(await res.text(), { cause: res });
    }
    const resJSON = await res.json();

    if (resJSON.errors) {
      throw new Error("Payload contains errors", { cause: resJSON.errors });
    }
    return resJSON;
  } catch (error) {
    console.log(error);
  }
}

function tidyHardcoverOutput(hardcoverOutputObject) {
  const myTbrBooks = hardcoverOutputObject.data.me[0].user_books;

  const myTbrBooksOutput = myTbrBooks.map(function (inputBook) {
    const book = inputBook.book;
    const authorNameSplit = book.contributions[0].author.name.trim().split(" ");
    const output = {
      title: book.title,
      author: book.contributions[0].author.name,
      authorSurname: authorNameSplit.toReversed()[0], // assuming last name is after the space
      bookSeries:
        (book.book_series.length && book.book_series[0].series.name) || null,
      bookSeriesPosition:
        (book.book_series.length && book.book_series[0].position) || null,
      releaseYear: book.release_year,
      releaseDate: book.release_date,
      id: book.id,
    };
    return output;
  });

  return myTbrBooksOutput;
}

async function checkLibrary() {
  const books = await fetchHardcoverTBR();
  const tidyHardcoverData = tidyHardcoverOutput(books);
  // Navigate the page to a URL.
  await page.goto("https://col.ent.sirsidynix.net.uk/client/en_GB/default/#");

  // Set screen size.
  await page.setViewport({ width: 1080, height: 1024 });

  let allBookListOutput = [];
  const bookName = "Katabasis";
  const bookAuthor = "Kuang";

  const bookList = [
    { bookName: "Katabasis", bookAuthor: "Kuang" },
    { bookName: "The binding", bookAuthor: "Collins" },
  ];
  // const oneItem = bookList[0]

  for (let i = 0; i < bookList.length; i++) {
    // =======
    const oneItem = bookList[i];
    const searchBox = `[id="q"]`;
    await page.locator(searchBox).fill(oneItem.bookName);
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

    // ---
    await page.waitForSelector(".results_cell");
    await page.waitForSelector(".detailItemTable");
    await page.waitForNetworkIdle();

    const results = await page.$$eval(
      ".results_cell",
      function (results, oneItem) {
        const searchResults = [];
        // console.log("bookAuthor", oneItem.bookAuthor);
        results.forEach(async function (result) {
          const innerText = result.innerText;

          if (innerText.includes(oneItem.bookAuthor)) {
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

    const singleBookOutput = {
      ...oneItem,
      results,
    };

    allBookListOutput.push(singleBookOutput);
    // console.log('================')
    // console.log("results", results);
    // console.log('================')

    // =======
  }

  console.log(allBookListOutput);
  // ---

  // WORKS for single item
  // await page.waitForSelector('.results_cell')
  // const result = await page.$eval('.results_cell', e => e.innerText);

  // console.log(result);

  // ---
}

// checkLibrary();
