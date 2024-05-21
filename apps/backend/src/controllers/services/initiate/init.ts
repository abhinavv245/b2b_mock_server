import { NextFunction, Request, Response } from "express";
import {
	MOCKSERVER_ID,
	SERVICES_BAP_MOCKSERVER_URL,
	checkIfCustomized,
	createAuthHeader,
	logger,
	redis,
	redisFetch
} from "../../../lib/utils";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export const initiateInitController = async (req: Request, res: Response, next: NextFunction) => {
	const { scenario, transactionId } = req.body;

	// const transactionKeys = await redis.keys(`${transactionId}-*`);
	// const ifTransactionExist = transactionKeys.filter((e) =>
	// 	e.includes("on_select-to-server")
	// );

	// if (ifTransactionExist.length === 0) {
	// 	return res.status(400).json({
	// 		message: {
	// 			ack: {
	// 				status: "NACK",
	// 			},
	// 		},
	// 		error: {
	// 			message: "On Select doesn't exist",
	// 		},
	// 	});
	// }
	// const transaction = await redis.mget(ifTransactionExist);
	// const parsedTransaction = transaction.map((ele) => {
	// 	return JSON.parse(ele as string);
	// });

	const on_select = await redisFetch("on_select", transactionId)
	if (!on_select) {
		return res.status(400).json({
			message: {
				ack: {
					status: "NACK",
				},
			},
			error: {
				message: "On Select doesn't exist",
			},
		});
	}

	// const request = parsedTransaction[0].request;
	if (Object.keys(on_select).includes("error")) {
		return res.status(400).json({
			message: {
				ack: {
					status: "NACK",
				},
			},
			error: {
				message: "On Select had errors",
			},
		});
	}

	return intializeRequest(res, next, on_select
		, scenario);
};

const intializeRequest = async (
	res: Response,
	next: NextFunction,
	transaction: any,
	scenario: string
) => {
	const {
		context,
		message: {
			order: { provider, fulfillments, quote },
		},
	} = transaction;
	let { payments, items } = transaction.message.order;
	const { id, type, stops } = fulfillments[0];
	const { id: parent_item_id, location_ids, ...item } = items[0];
	const { transaction_id } = context;

	const customized = checkIfCustomized(items);
	// console.log("Customized ", customized)
	//get item_id with quantity

	if (customized) {
		// items = items.map((e: { quantity: any; }) => (Object.keys(e).includes("quantity") ? {...e, quantity: {...e.quantity,
		// 	measure: {
		// 		unit: "unit",
		// 		value: "1",
		// 	},}}: e))
	} else {
		items = items.map(
			({ location_ids, ...items }: { location_ids: any }) => items
		);
	}

	// console.log("ITEMS BEING SENT:::", items)

	const init = {
		context: {
			...context,
			timestamp: new Date().toISOString(),
			action: "init",
			bap_id: MOCKSERVER_ID,
			bap_uri: SERVICES_BAP_MOCKSERVER_URL,
			message_id: uuidv4(),
		},
		message: {
			order: {
				provider: {
					...provider,
					locations: [{ id: uuidv4() }],
				},
				items,
				billing: {
					name: "ONDC buyer",
					address:
						"22, Mahatma Gandhi Rd, Craig Park Layout, Ashok Nagar, Bengaluru, Karnataka 560001",
					state: {
						name: "Karnataka",
					},
					city: {
						name: "Bengaluru",
					},
					tax_id: "XXXXXXXXXXXXXXX",
					email: "nobody@nomail.com",
					phone: "9886098860",
				},
				fulfillments: [
					{
						id,
						type,
						stops: [
							{
								...stops[0],
								id: customized ? stops[0].id : undefined,
								location: {
									gps: "12.974002,77.613458",
									address: "My House #, My buildin",
									city: {
										name: "Bengaluru",
									},
									country: {
										code: "IND",
									},
									area_code: "560001",
									state: {
										name: "Karnataka",
									},
								},
								contact: {
									phone: "9886098860",
								},
								time: stops[0].time,
							},
						],
					},
				],
				payments,
			},
		},
	};
	const header = await createAuthHeader(init);
	try {
		await redis.set(
			`${transaction_id}-init-from-server`,
			JSON.stringify({ request: { ...init } })
		);
		await axios.post(`${context.bpp_uri}/init?scenario=${scenario}`, init, {
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
