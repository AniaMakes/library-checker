export default function tidyHardcoverOutput(hardcoverOutputObject) {
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
