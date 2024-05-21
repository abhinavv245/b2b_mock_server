import { NextFunction, Request, Response } from "express";
import {
	MOCKSERVER_ID,
	SERVICES_BAP_MOCKSERVER_URL,
	SERVICES_EXAMPLES_PATH,
	createAuthHeader,
	logger,
	redis,
} from "../../../lib/utils";
import axios from "axios";
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { v4 as uuidv4 } from "uuid";

export const initiateSearchController = async (req: Request, res: Response,  next: NextFunction) => {
	const { bpp_uri, city, domain } = req.body;

	var file = fs.readFileSync(
		path.join(SERVICES_EXAMPLES_PATH, "search/search_by_category.yaml")
	);
	var search = YAML.parse(file.toString());
	search = search.value;
	const transaction_id = uuidv4();
	search = {
		...search,
		context: {
			...search.context,
			timestamp: new Date().toISOString(),
			location: {
				...search.context.location,
				city: {
					code: city
				}
			},
			transaction_id,
			// bpp_id: MOCKSERVER_ID,
			// bpp_uri,
			domain,
			bap_id: MOCKSERVER_ID,
			bap_uri: SERVICES_BAP_MOCKSERVER_URL,
			message_id: uuidv4()
		},
	};

	const header = await createAuthHeader(search);
	try {
		await redis.set(
			`${transaction_id}-search-from-server`,
			JSON.stringify({ request: { ...search } })
		);
		const response = await axios.post(`${bpp_uri}/search`, search, {
			headers: {
				// "X-Gateway-Authorization": header,
				authorization: header,
			},
		});

		return res.json({
			message: {
				ack: {
					status: "ACK",
				},
			},
			transaction_id,
		});
	} catch (error) {
		return next(error)
	}
};
