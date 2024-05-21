import { NextFunction, Request, Response } from "express";
import { responseBuilder, B2B_EXAMPLES_PATH, redis } from "../../../lib/utils";

export const cancelController = async (req: Request, res: Response, next: NextFunction) => {
	const { transaction_id } = req.body.context;
	const transactionKeys = await redis.keys(`${transaction_id}-*`);
	const ifTransactionExist = transactionKeys.filter((e) =>
		e.includes("on_confirm-from-server")
	);

	if (ifTransactionExist.length === 0) {
		return res.status(400).json({
			message: {
				ack: {
					status: "NACK",
				},
			},
			error: {
				message: "on confirm doesn't exist",
			},
		});
	}
	const transaction = await redis.mget(ifTransactionExist);
	const parsedTransaction = transaction.map((ele: any) => {
		return JSON.parse(ele as string);
	});
	// getting on_search data for payment_ids
	const search = await redis.mget(`${transaction_id}-on_search-from-server`);
	const parsedSearch = search.map((ele: any) => {
		return JSON.parse(ele as string);
	});
	// console.log("Search ::", parsedSearch[0].request.message.catalog.providers)

	const provider_id = parsedTransaction[0].request.message.order.provider.id;

	const item_payment_ids =
		parsedSearch[0].request.message.catalog.providers.map((itm: any) => {
			if (itm.id === provider_id) {
				const result = itm.items.reduce(
					(accumulator: any, currentItem: any) => {
						accumulator[currentItem.id] = currentItem.payment_ids;
						return accumulator;
					},
					{}
				);
				return result;
			}
		});

	if (!item_payment_ids) {
		return res.status(400).json({
			message: {
				ack: {
					status: "NACK",
				},
			},
			error: {
				message: "Payment and Provider ID related mismatch",
			},
		});
	}

	if (
		parsedTransaction[0].request.message.order.id != req.body.message.order_id
	) {
		return res.status(400).json({
			message: {
				ack: {
					status: "NACK",
				},
			},
			error: {
				message: "Order id does not exist",
			},
		});
	}

	// console.log("Items with there ids :", item_payment_ids[0])
	return cancelRequest(
		req,
		res,
		next,
		parsedTransaction[0].request,
		item_payment_ids[0],
	);
};

const cancelRequest = async (
	req: Request,
	res: Response,
	next: NextFunction,
	transaction: any,
	item_payment_ids: any,
) => {
	// const { message } = transaction
	const { context } = req.body;
	const responseMessage = {
		...transaction.message,
		order: {
			...transaction.message.order,
			state: "Cancelled",
			cancellation: {
				cancelled_by: req.body.context.bap_id,
				reason: {
					id: req.body.message.cancellation_reason_id,
				},
			},
			fulfillments: transaction.message.order.fulfillments.map(
				(fulfillment: any) => ({
					...fulfillment,
					state: {
						...fulfillment.state,
						descriptor: {
							code: "Cancelled",
						},
					},
					stops: fulfillment.stops.map((stop: any) => {
						// Add the instructions to both start and end stops
						const instructions = {
							name: "Proof of pickup",
							short_desc: "Proof of pickup details",
							long_desc: "Proof of pickup details",
							images: ["https://image1_url.png"],
						};
						// Check if the stop type is "end"
						if (stop.type === "end") {
							// Add the agent object to the stop
							return {
								...stop,
								instructions: {
									...instructions,
									name: "Proof of delivery",
									short_desc: "Proof of delivery details",
									long_desc: "Proof of delivery details",
								},
								location: {
									...stop.location,
								},
								agent: {
									person: {
										name: "Ramu",
									},
									contact: {
										phone: "9886098860",
									},
								},
							};
						} else if (stop.type === "start") {
							// For stops of type "start", add the instructions and location modifications
							return {
								...stop,
								instructions,
								location: {
									...stop.location,
									descriptor: {
										...stop.location.descriptor,
										images: ["https://gf-integration/images/5.png"],
									},
								},
							};
						} else {
							// For other types, return the stop as is with instructions
							return {
								...stop,
								instructions,
							};
						}
					}),
					rateable: undefined,
				})
			),
			items: transaction.message.order.items.map((itm: any) => ({
				...itm,
				payment_ids:
					item_payment_ids && item_payment_ids[itm.id]
						? item_payment_ids[itm.id]
						: undefined,
			})),
		},
	};

	return responseBuilder(
		res,
		next,
		context,
		responseMessage,
		`${req.body.context.bap_uri}${
			req.body.context.bap_uri.endsWith("/") ? "on_cancel" : "/on_cancel"
		}`,
		`on_cancel`,
		"b2b"
	);
};
