import axios from "axios";
import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
	B2B_BAP_MOCKSERVER_URL,
	B2B_BPP_MOCKSERVER_URL,
	MOCKSERVER_ID,
	SERVICES_BAP_MOCKSERVER_URL,
	SERVICES_BPP_MOCKSERVER_URL,
} from "./constants";
import { createAuthHeader } from "./responseAuth";
import { logger } from "./logger";
import { TransactionType, redis } from "./redis";

interface TagDescriptor {
	code: string;
}

interface TagList {
	descriptor: TagDescriptor;
	value: string;
}

interface Quantity {
	selected: {
		count: number;
	};
}

interface AddOn {
	id: string;
}

interface Tag {
	descriptor: TagDescriptor;
	list: TagList[];
}

interface Item {
	fulfillment_ids: string[];
	id: string;
	quantity: Quantity;
	add_ons: AddOn[];
	tags: Tag[];
}

export const responseBuilder = async (
	res: Response,
	reqContext: object,
	message: object,
	uri: string,
	action: string,
	domain: "b2b" | "services"
) => {
	var transaction: TransactionType = res.locals.logs;
	res.locals = {};
	// var ts = new Date((reqContext as any).timestamp);
	var ts = new Date();
	ts.setSeconds(ts.getSeconds() + 1);
	const sandboxMode = res.getHeader("mode") === "sandbox";
	// console.log("SANDBOX>", sandboxMode);
	var async: { message: object; context?: object } = { context: {}, message };

	if (action.startsWith("on_")) {
		// const { bap_uri, bap_id, ...remainingContext } = reqContext as any;
		async = {
			...async,
			context: {
				// ...remainingContext,
				...reqContext,
				bpp_id: MOCKSERVER_ID,
				bpp_uri:
					domain === "b2b"
						? B2B_BPP_MOCKSERVER_URL
						: SERVICES_BPP_MOCKSERVER_URL,
				timestamp: ts.toISOString(),
				action,
			},
		};
	} else {
		// const { bpp_uri, bpp_id, ...remainingContext } = reqContext as any;
		async = {
			...async,
			context: {
				// ...remainingContext,
				...reqContext,
				bap_id: MOCKSERVER_ID,
				bap_uri:
					domain === "b2b"
						? B2B_BAP_MOCKSERVER_URL
						: SERVICES_BAP_MOCKSERVER_URL,
				timestamp: ts.toISOString(),
				message_id: uuidv4(),
				action,
			},
		};
	}
	const header = await createAuthHeader(async);
	res.setHeader("authorization", header);

	if (sandboxMode) {
		logger.info("=======================");
		logger.info("TIME", Date.now());
		logger.info("ACTION", action);
		// logger.info("TRANSACTION BEFORE:", transaction)

		// if (action.startsWith("on_")) {
		var log: TransactionType = {
			request: async,
		};
		await redis.set(
			`${(async.context! as any).transaction_id}-${action}-from-server`,
			JSON.stringify(log)
		);
		try {
			const response = await axios.post(uri, async, {
				headers: {
					authorization: header,
				},
			});

			log.response = {
				timestamp: new Date().toISOString(),
				response: response.data,
			};

			await redis.set(
				`${(async.context! as any).transaction_id}-${action}-from-server`,
				JSON.stringify(log)
			);
		} catch (error) {
			console.log("ERROR", error);
			logger.error({
				type: "response",
				message: {
					message: "ERROR OCCURRED WHILE PINGING SANDBOX RESPONSE",
					error: error,
				},
			});
			logger.error({
				type: "response",
				message: {
					message: { ack: { status: "NACK" } },
					error: {
						message: (error as any).response.data,
					},
				},
			});
			const response = {
				message: {
					ack: {
						status: "NACK",
					},
				},
				error: {
					// message: (error as any).message,
					message: (error as any).response.data,
				},
			};
			log.response = {
				timestamp: new Date().toISOString(),
				response: response.message,
			};

			await redis.set(
				`${(async.context! as any).transaction_id}-${action}-from-server`,
				JSON.stringify(log)
			);

			return res.json({
				...response,
				async,
			});
		}
		// } else {
		// 	transaction.actionStats = {
		// 		...transaction.actionStats,
		// 		[action]: {
		// 			requestFromServer: true,
		// 			requestToServer: false,
		// 			cached: true,
		// 			npRequest: {
		// 				timestamp: ts.toISOString(),
		// 				request: async,
		// 			},
		// 		},
		// 	};
		// 	await redis.set(
		// 		(async.context! as any).transaction_id,
		// 		JSON.stringify(transaction)
		// 	);
		// }
		logger.info("TRANSACTION AFTER:", log);
		logger.info("**********************");

		logger.info({ message: { ack: { status: "ACK" } } });
		return res.json({
			message: {
				ack: {
					status: "ACK",
				},
			},
		});
	} else {
		logger.info({ sync: { message: { ack: { status: "ACK" } } }, async });
		return res.json({
			sync: {
				message: {
					ack: {
						status: "ACK",
					},
				},
			},
			async,
		});
	}
};

export const quoteCreator = (items: Item[]) => {
	var breakup: any[] = [];
	const chargesOnFulfillment = [
		{
			"@ondc/org/item_id": "F1",
			title: "Delivery charges",
			"@ondc/org/title_type": "delivery",
			price: {
				currency: "INR",
				value: "4000",
			},
		},
		{
			"@ondc/org/item_id": "F1",
			title: "Packing charges",
			"@ondc/org/title_type": "packing",
			price: {
				currency: "INR",
				value: "500",
			},
		},
		{
			"@ondc/org/item_id": "F1",
			title: "Convenience Fee",
			"@ondc/org/title_type": "misc",
			price: {
				currency: "INR",
				value: "100",
			},
		},
	];
	const chargesOnItem = [
		{
			"@ondc/org/item_id": "I1",
			title: "Tax",
			"@ondc/org/title_type": "tax",
			price: {
				currency: "INR",
				value: "0",
			},
		},
		{
			"@ondc/org/item_id": "I1",
			title: "Discount",
			"@ondc/org/title_type": "discount",
			price: {
				currency: "INR",
				value: "-1000",
			},
		},
	];
	items.forEach((item: any) => {
		breakup = [
			...breakup,
			...chargesOnItem,
			{
				"@ondc/org/item_id": item.id,
				"@ondc/org/item_quantity": {
					count: item.quantity.selected.count,
				},
				title: "Product Name Here",
				"@ondc/org/title_type": "item",
				price: {
					currency: "INR",
					value: (item.quantity.selected.count * 250).toString(),
				},
				item: {
					price: {
						currency: "INR",
						value: "250",
					},
				},
			},
		];
		item.fulfillment_ids.forEach((eachId: string) => {
			breakup = [
				...breakup,
				...chargesOnFulfillment.map((each) => ({
					...each,
					"@ondc/org/item_id": eachId,
				})),
			];
		});
	});
	return {
		breakup,
		price: {
			currency: "INR",
			value: (53_600 * items.length).toString(),
		},
		ttl: "P1D",
	};
};

export const quoteCreatorService = (items: Item[]) => {
	var breakup: any[] = [
		{
			title: "Service/Consultation",
			price: {
				currency: "INR",
				value: "99",
			},
			tags: [
				{
					"descriptor": {
						"code": "title"
					},
					"list": [
						{
							"descriptor": {
								"code": "type"
							},
							"value": "item"
						}
					]
				}
			]
		}, {
			title: "tax",
			price: {
				currency: "INR",
				value: "0",
			},
			tags: [
				{
					"descriptor": {
						"code": "title"
					},
					"list": [
						{
							"descriptor": {
								"code": "type"
							},
							"value": "tax"
						}
					]
				}
			]
		}
	];

	items.forEach(item => {
		breakup.forEach((each) => {
			each.item = {
				id: item.id,
				price: {
					currency: "INR",
					value: "99",
				}
			}
		})
	})

	return {
		breakup,
		price: {
			currency: "INR",
			value: (99 * items.length).toString(),
		},
		ttl: "P1D",
	};
};
