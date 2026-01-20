import dotenv from "dotenv";

dotenv.config();

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

export default async function fetchHardcoverTBR() {
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
