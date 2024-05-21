import axios from "axios";
import { NextFunction, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
	B2B_BAP_MOCKSERVER_URL,
	B2B_BPP_MOCKSERVER_URL,
	MOCKSERVER_ID,
	SERVICES_BAP_MOCKSERVER_URL,
	SERVICES_BPP_MOCKSERVER_URL,
	SERVICES_EXAMPLES_PATH,
} from "./constants";
import { createAuthHeader } from "./responseAuth";
import { logger } from "./logger";
import { TransactionType, redis } from "./redis";
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { AxiosError } from "axios";

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
	next: NextFunction,
	reqContext: object,
	message: object,
	uri: string,
	action: string,
	domain: "b2b" | "services",
	error?: object | undefined,
) => {
	res.locals = {};
	// var ts = new Date((reqContext as any).timestamp);
	var ts = new Date();
	ts.setSeconds(ts.getSeconds() + 1);
	const sandboxMode = res.getHeader("mode") === "sandbox";
	// console.log("SANDBOX>", sandboxMode);
	var async: { message: object; context?: object; error?: object } = {
		context: {},
		message,
	};

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
	if (error) {
		async = { ...async, error };
	}
	const header = await createAuthHeader(async);

	if (sandboxMode) {
		if (action.startsWith("on_")) {
			var log: TransactionType = {
				request: async,
			};
			if (action === "on_status") {
				const transactionKeys = await redis.keys(
					`${(async.context! as any).transaction_id}-*`
				);
				const logIndex = transactionKeys.filter((e) =>
					e.includes("on_status-to-server")
				).length;
				await redis.set(
					`${
						(async.context! as any).transaction_id
					}-${logIndex}-${action}-from-server`,
					JSON.stringify(log)
				);
			} else {
				await redis.set(
					`${(async.context! as any).transaction_id}-${action}-from-server`,
					JSON.stringify(log)
				);
			}
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
				const response =
					error instanceof AxiosError
						? error.response
						: {
								message: {
									ack: {
										status: "NACK",
									},
								},
								error: {
									message: error,
								},
						  };
				log.response = {
					timestamp: new Date().toISOString(),
					response: response,
				};

				await redis.set(
					`${(async.context! as any).transaction_id}-${action}-from-server`,
					JSON.stringify(log)
				);

				return next(error)
			}
		}

		logger.info({
			type: "response",
			action: action,
			transaction_id: (reqContext as any).transaction_id,
			message: { sync: { message: { ack: { status: "ACK" } } } },
		});
		return res.json({
			message: {
				ack: {
					status: "ACK",
				},
			},
		});
	} else {
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
					descriptor: {
						code: "title",
					},
					list: [
						{
							descriptor: {
								code: "type",
							},
							value: "item",
						},
					],
				},
			],
		},
		{
			title: "tax",
			price: {
				currency: "INR",
				value: "0",
			},
			tags: [
				{
					descriptor: {
						code: "title",
					},
					list: [
						{
							descriptor: {
								code: "type",
							},
							value: "tax",
						},
					],
				},
			],
		},
	];

	items.forEach((item) => {
		breakup.forEach((each) => {
			each.item = {
				id: item.id,
				price: {
					currency: "INR",
					value: "99",
				},
				quantity: item.quantity ? item.quantity : undefined,
			};
		});
	});
	console;
	return {
		breakup,
		price: {
			currency: "INR",
			value: (99 * items.length).toString(),
		},
		ttl: "P1D",
	};
};

export const quoteCreatorServiceCustomized = (items: Item[]) => {
	// var breakup: any[] = [
	// 	{
	// 		title: "Service/Consultation",
	// 		price: {
	// 			currency: "INR",
	// 			value: "99",
	// 		},
	// 		tags: [
	// 			{
	// 				"descriptor": {
	// 					"code": "title"
	// 				},
	// 				"list": [
	// 					{
	// 						"descriptor": {
	// 							"code": "type"
	// 						},
	// 						"value": "item"
	// 					}
	// 				]
	// 			}
	// 		]
	// 	}, {
	// 		title: "tax",
	// 		price: {
	// 			currency: "INR",
	// 			value: "0",
	// 		},
	// 		tags: [
	// 			{
	// 				"descriptor": {
	// 					"code": "title"
	// 				},
	// 				"list": [
	// 					{
	// 						"descriptor": {
	// 							"code": "type"
	// 						},
	// 						"value": "tax"
	// 					}
	// 				]
	// 			}
	// 		]
	// 	}
	// ];

	const file = fs.readFileSync(
		path.join(
			SERVICES_EXAMPLES_PATH,
			"on_select/on_select_service_customization_confirmed.yaml"
		)
	);
	const response = YAML.parse(file.toString());

	const { price, ttl, breakup } = response.value.message.order.quote;

	// const breakup = [
	// 	{
	// 		"title": "Cook - On Demand",
	// 		"price": {
	// 			"currency": "INR",
	// 			"value": "00.00"
	// 		},
	// 		"item": {
	// 			"id": "I1",
	// 			"price": {
	// 				"currency": "INR",
	// 				"value": "00.00"
	// 			}
	// 		},
	// 		"tags": [
	// 			{
	// 				"descriptor": {
	// 					"code": "title"
	// 				},
	// 				"list": [
	// 					{
	// 						"descriptor": {
	// 							"code": "type"
	// 						},
	// 						"value": "item"
	// 					}
	// 				]
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"title": "People",
	// 		"price": {
	// 			"currency": "INR",
	// 			"value": "299.00"
	// 		},
	// 		"item": {
	// 			"id": "IC1",
	// 			"quantity": {
	// 				"selected": {
	// 					"count": 3
	// 				}
	// 			},
	// 			"price": {
	// 				"currency": "INR",
	// 				"value": "199.00"
	// 			}
	// 		},
	// 		"tags": [
	// 			{
	// 				"descriptor": {
	// 					"code": "title"
	// 				},
	// 				"list": [
	// 					{
	// 						"descriptor": {
	// 							"code": "type"
	// 						},
	// 						"value": "customization"
	// 					}
	// 				]
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"title": "Sandwich",
	// 		"price": {
	// 			"currency": "INR",
	// 			"value": "199.00"
	// 		},
	// 		"item": {
	// 			"id": "IC2",
	// 			"quantity": {
	// 				"selected": {
	// 					"count": 1
	// 				}
	// 			},
	// 			"price": {
	// 				"currency": "INR",
	// 				"value": "199.00"
	// 			}
	// 		},
	// 		"tags": [
	// 			{
	// 				"descriptor": {
	// 					"code": "title"
	// 				},
	// 				"list": [
	// 					{
	// 						"descriptor": {
	// 							"code": "type"
	// 						},
	// 						"value": "customization"
	// 					}
	// 				]
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"title": "Dahi Ke Kebab",
	// 		"price": {
	// 			"currency": "INR",
	// 			"value": "199.00"
	// 		},
	// 		"item": {
	// 			"id": "IC3",
	// 			"quantity": {
	// 				"selected": {
	// 					"count": 1
	// 				}
	// 			},
	// 			"price": {
	// 				"currency": "INR",
	// 				"value": "199.00"
	// 			}
	// 		},
	// 		"tags": [
	// 			{
	// 				"descriptor": {
	// 					"code": "title"
	// 				},
	// 				"list": [
	// 					{
	// 						"descriptor": {
	// 							"code": "type"
	// 						},
	// 						"value": "customization"
	// 					}
	// 				]
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"title": "Dal Makhni",
	// 		"price": {
	// 			"currency": "INR",
	// 			"value": "199.00"
	// 		},
	// 		"item": {
	// 			"id": "IC4",
	// 			"quantity": {
	// 				"selected": {
	// 					"count": 1
	// 				}
	// 			},
	// 			"price": {
	// 				"currency": "INR",
	// 				"value": "199.00"
	// 			}
	// 		},
	// 		"tags": [
	// 			{
	// 				"descriptor": {
	// 					"code": "title"
	// 				},
	// 				"list": [
	// 					{
	// 						"descriptor": {
	// 							"code": "type"
	// 						},
	// 						"value": "customization"
	// 					}
	// 				]
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"title": "tax",
	// 		"price": {
	// 			"currency": "INR",
	// 			"value": "25"
	// 		},
	// 		"item": {
	// 			"id": "I1"
	// 		},
	// 		"tags": [
	// 			{
	// 				"descriptor": {
	// 					"code": "title"
	// 				},
	// 				"list": [
	// 					{
	// 						"descriptor": {
	// 							"code": "type"
	// 						},
	// 						"value": "tax"
	// 					}
	// 				]
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"title": "tax",
	// 		"price": {
	// 			"currency": "INR",
	// 			"value": "25"
	// 		},
	// 		"item": {
	// 			"id": "IC1"
	// 		},
	// 		"tags": [
	// 			{
	// 				"descriptor": {
	// 					"code": "title"
	// 				},
	// 				"list": [
	// 					{
	// 						"descriptor": {
	// 							"code": "type"
	// 						},
	// 						"value": "tax"
	// 					}
	// 				]
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"title": "tax",
	// 		"price": {
	// 			"currency": "INR",
	// 			"value": "25"
	// 		},
	// 		"item": {
	// 			"id": "IC2"
	// 		},
	// 		"tags": [
	// 			{
	// 				"descriptor": {
	// 					"code": "title"
	// 				},
	// 				"list": [
	// 					{
	// 						"descriptor": {
	// 							"code": "type"
	// 						},
	// 						"value": "tax"
	// 					}
	// 				]
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"title": "tax",
	// 		"price": {
	// 			"currency": "INR",
	// 			"value": "25"
	// 		},
	// 		"item": {
	// 			"id": "IC3"
	// 		},
	// 		"tags": [
	// 			{
	// 				"descriptor": {
	// 					"code": "title"
	// 				},
	// 				"list": [
	// 					{
	// 						"descriptor": {
	// 							"code": "type"
	// 						},
	// 						"value": "tax"
	// 					}
	// 				]
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"title": "tax",
	// 		"price": {
	// 			"currency": "INR",
	// 			"value": "25"
	// 		},
	// 		"item": {
	// 			"id": "IC4"
	// 		},
	// 		"tags": [
	// 			{
	// 				"descriptor": {
	// 					"code": "title"
	// 				},
	// 				"list": [
	// 					{
	// 						"descriptor": {
	// 							"code": "type"
	// 						},
	// 						"value": "tax"
	// 					}
	// 				]
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"title": "discount",
	// 		"price": {
	// 			"currency": "INR",
	// 			"value": "0"
	// 		},
	// 		"item": {
	// 			"id": "I1"
	// 		},
	// 		"tags": [
	// 			{
	// 				"descriptor": {
	// 					"code": "title"
	// 				},
	// 				"list": [
	// 					{
	// 						"descriptor": {
	// 							"code": "type"
	// 						},
	// 						"value": "discount"
	// 					}
	// 				]
	// 			}
	// 		]
	// 	},
	// 	{
	// 		"title": "convenience_fee",
	// 		"price": {
	// 			"currency": "INR",
	// 			"value": "0"
	// 		},
	// 		"item": {
	// 			"id": "I1"
	// 		},
	// 		"tags": [
	// 			{
	// 				"descriptor": {
	// 					"code": "title"
	// 				},
	// 				"list": [
	// 					{
	// 						"descriptor": {
	// 							"code": "type"
	// 						},
	// 						"value": "misc"
	// 					}
	// 				]
	// 			}
	// 		]
	// 	}
	// ]

	items.forEach((item) => {
		breakup.forEach((each: any) => {
			each.item = {
				id: item.id,
				price: {
					currency: "INR",
					value: "99",
				},
				quantity: item.quantity ? item.quantity : undefined,
			};
		});
	});

	return {
		breakup,
		price: {
			currency: "INR",
			value: (99 * items.length).toString(),
		},
		ttl,
	};
};

export const checkIfCustomized = (items: Item[]) => {
	return items.some(
		(item) =>
			item.tags &&
			item.tags.some(
				(tag) =>
					tag.list &&
					tag.list.some((subTag) => {
						if (subTag.descriptor.code === "type") {
							return subTag.value === "customization";
						}
					})
			)
	);
};
