import { NextFunction, Request, Response } from "express";
import {
	SERVICES_BAP_MOCKSERVER_URL,
	MOCKSERVER_ID,
	checkIfCustomized,
	createAuthHeader,
	logger,
	quoteCreatorService,
	quoteCreatorServiceCustomized,
	redis,
	redisFetch
} from "../../../lib/utils";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export const initiateConfirmController = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { scenario, transactionId } = req.body;

	// const transactionKeys = await redis.keys(`${transactionId}-*`);
	// const ifTransactionExist = transactionKeys.filter((e) =>
	// 	e.includes("on_init-to-server")
	// );

	// if (ifTransactionExist.length === 0) {
	// 	return res.status(400).json({
	// 		message: {
	// 			ack: {
	// 				status: "NACK",
	// 			},
	// 		},
	// 		error: {
	// 			message: "On Init doesn't exist",
	// 		},
	// 	});
	// }
	// const transaction = await redis.mget(ifTransactionExist);
	// const parsedTransaction = transaction.map((ele) => {
	// 	return JSON.parse(ele as string);
	// });
	const on_init = await redisFetch("on_init", transactionId)
	if(!on_init){
			return res.status(400).json({
				message: {
					ack: {
						status: "NACK",
					},
				},
				error: {
					message: "On Init doesn't exist",
				},
			});
	}

	// console.log("parsedTransaction:::: ", parsedTransaction[0]);
	return intializeRequest(res, next, on_init, scenario);
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
			order: {
				provider,
				locations,
				payments,
				fulfillments,
				xinput,
				items,
			},
		},
	} = transaction;
	const { transaction_id } = context;
	const { stops, ...remainingfulfillments } = fulfillments[0];

	const timestamp = new Date().toISOString();

	const customized = checkIfCustomized(items);
	// console.log("Xinput ::", xinput)
	const confirm = {
		context: {
			...context,
			timestamp: new Date().toISOString(),
			action: "confirm",
			bap_id: MOCKSERVER_ID,
			bap_uri: SERVICES_BAP_MOCKSERVER_URL,
			message_id: uuidv4()
		},
		message: {
			order: {
				...transaction.message.order,
				id: uuidv4(),
				status: "Created",
				provider: {
					...provider,
					locations,
				},
				items,
				fulfillments: [
					{
						...remainingfulfillments,
						stops: stops.map((stop: any) => {
							return {
								...stop,
								contact: {
									...stop.contact,
									email: stop.contact && stop.contact.email ? stop.contact.email : "nobody@nomail.com"
								},
								customer: {
									person: {
										name: "Ramu",
									},
								},
								tags: undefined
							};
						}),
					},
				],
				quote: customized
					? quoteCreatorServiceCustomized(items)
					: quoteCreatorService(items),
				payments: [
					{
						//hardcoded transaction_id
						...payments[0],
						params: {
							...payments[0].params,
							transaction_id: "xxxxxxxx",
						},
						status: "PAID",
					},
				],
				created_at: timestamp,
				updated_at: timestamp,
				xinput: {
					...xinput,
					form: {
						...xinput.form,
						submission_id: "xxxxxxxxxx",
						status: "SUCCESS",

					}
				},
			},
		},
	};
	confirm.message.order.quote.breakup.forEach((itm: any) => {
		itm.item.quantity = {
			selected: {
				count: 3
			}
		}
	})
	const header = await createAuthHeader(confirm);
	try {
		await redis.set(
			`${transaction_id}-confirm-from-server`,
			JSON.stringify({ request: confirm })
		);
		await axios.post(`${context.bpp_uri}/confirm?scenario=${scenario}`, confirm, {
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
