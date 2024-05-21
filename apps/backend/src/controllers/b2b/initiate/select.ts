import { NextFunction, Request, Response } from "express";
import {
	B2B_BAP_MOCKSERVER_URL,
	B2B_EXAMPLES_PATH,
	MOCKSERVER_ID,
	createAuthHeader,
	logger,
	redis,
} from "../../../lib/utils";
import axios from "axios";
import fs from "fs";
import path from "path";
import YAML from "yaml";

import { v4 as uuidv4 } from "uuid";
import { set } from "lodash";
import { AxiosError } from "axios";

export const initiateSelectController = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { scenario, transactionId } = req.body;

	const transactionKeys = await redis.keys(`${transactionId}-*`);
	const ifTransactionExist = transactionKeys.filter((e) =>
		e.includes("on_search-to-server")
	);

	if (ifTransactionExist.length === 0) {
		return res.status(400).json({
			message: {
				ack: {
					status: "NACK",
				},
			},
			error: {
				message: "On search doesn't exist",
			},
		});
	}
	const transaction = await redis.mget(ifTransactionExist);
	const parsedTransaction = transaction.map((ele) => {
		return JSON.parse(ele as string);
	});

	return intializeRequest(res, next, parsedTransaction[0].request, scenario);
};

const intializeRequest = async (
	res: Response,
	next: NextFunction,
	transaction: any,
	scenario: string
) => {
	try {
		const { context, message } = transaction;
		const { transaction_id } = context;

		const file = fs.readFileSync(
			path.join(B2B_EXAMPLES_PATH, "select/select_domestic.yaml")
		);
		const response = YAML.parse(file.toString());

		if (scenario !== "rfq") {
			delete response.value.message.order.items[0].tags;
		}
		const select = {
			context: {
				...context,
				timestamp: new Date().toISOString(),
				action: "select",
				message_id: uuidv4(),
				ttl: scenario === "rfq" ? "P1D" : "PT30S",
				bap_id: MOCKSERVER_ID,
				bap_uri: B2B_BAP_MOCKSERVER_URL,
			},
			message: {
				order: {
					provider: {
						id: message.catalog.providers[0].id,
						locations: [
							{
								id: message.catalog.providers[0].items[0].location_ids[0],
							},
						],
						ttl: scenario === "rfq" ? "P1D" : "PT30S",
					},
					items: [
						{
							...response.value.message.order.items[0],
							id: message.catalog.providers[0].items[0].id,
							location_ids: [
								message.catalog.providers[0].items[0].location_ids[0],
							],
							fulfillment_ids: [
								message.catalog.providers[0].items[0].fulfillment_ids[0],
							],
						},
					],
					fulfillments: [
						{
							...message.catalog.fulfillments[0],
							type: message.catalog.providers[0].items[0].fulfillment_ids[0],
						},
					],
					payments: [message.catalog.payments[0]],
					tags: response.value.message.order.tags,
				},
			},
		};

		const header = await createAuthHeader(select);
		try {
			await redis.set(
				`${transaction_id}-select-from-server`,
				JSON.stringify({ request: { ...select } })
			);
			const response = await axios.post(
				`${context.bpp_uri}/select?scenario=${scenario}`,
				select,
				{
					headers: {
						// "X-Gateway-Authorization": header,
						authorization: header,
					},
				}
			);

			await redis.set(
				`${transaction_id}-select-from-server`,
				JSON.stringify({
					request: { ...select },
					response: {
						response: response.data,
						timestamp: new Date().toISOString(),
					},
				})
			);

			return res.json({
				message: {
					ack: {
						status: "ACK",
					},
				},
				transaction_id,
			});
		} catch (error) {
			await redis.set(
				`${transaction_id}-select-from-server`,
				JSON.stringify({
					request: { ...select },
					response: {
						response: error instanceof AxiosError ? error.response : error,
						timestamp: new Date().toISOString(),
					},
				})
			);

			return next(error);
		}
	} catch (err) {
		return next(err);
	}
};
