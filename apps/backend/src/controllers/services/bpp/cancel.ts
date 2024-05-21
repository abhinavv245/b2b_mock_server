import { NextFunction, Request, Response } from "express";
import { responseBuilder, redisFetch } from "../../../lib/utils";

export const cancelController = async (req: Request, res: Response, next: NextFunction) => {
	const { scenario } = req.query;
	const { transaction_id } = req.body.context;

	const on_confirm_data = await redisFetch("on_confirm", transaction_id)
	if (!on_confirm_data) {
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
	if (on_confirm_data.message.order.id != req.body.message.order_id) {
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

	const on_search_data = await redisFetch("on_search", transaction_id)
	
	// console.log("Search ::", parsedSearch[0].request.message.catalog.providers[0].items)
	const provider_id = on_confirm_data.message.order.provider.id

	const item_measure_ids = on_search_data.message.catalog.providers[0].items.reduce((accumulator: any, currentItem: any) => {
		accumulator[currentItem.id] = currentItem.quantity ? currentItem.quantity.unitized.measure : undefined;
		return accumulator;
	}, {});
	// console.log("Items with there ids :", item_measure_ids)
	req.body.item_measure_ids = item_measure_ids
	cancelRequest(req, res, next, on_confirm_data, scenario);
}

const cancelRequest = async (req: Request, res: Response, next: NextFunction, transaction: any, scenario: any) => {

	const { context } = req.body;

	const responseMessage = {
		order: {
			id: req.body.message.order_id,
			status: "Cancelled",
			cancellation: {
				cancelled_by: "CONSUMER",
				reason: {
					descriptor: {
						code: req.body.message.cancellation_reason_id
					}
				}
			},
			provider: {
				...transaction.message.order.provider,
				rateable: undefined
			},
			items: transaction.message.order.items.map((itm: any) => ({
				...itm,
				quantity: {
					...itm.quantity,
					measure: req.body.item_measure_ids[itm.id] ? req.body.item_measure_ids[itm.id] : { unit: "", value: "" }
				}
			})),
			quote: transaction.message.order.quote,
			fulfillments: transaction.message.order.fulfillments.map((fulfillment: any) => ({
				...fulfillment,
				state: {
					...fulfillment.state,
					descriptor: {
						code: "Cancelled"
					}
				},
				rateable: undefined
			})),
			billing: transaction.message.order.billing,
			payments: transaction.message.order.payments.map((itm: any) => ({
				...itm,
				tags: itm.tags.filter((tag: any) => tag.descriptor.code !== "Settlement_Counterparty")
			})),
			updated_at: new Date().toISOString()

		}
	}

	return responseBuilder(
		res,
		next,
		context,
		responseMessage,
		`${req.body.context.bap_uri}${req.body.context.bap_uri.endsWith("/") ? "on_cancel" : "/on_cancel"
		}`,
		`on_cancel`,
		"b2b",
	)
}


