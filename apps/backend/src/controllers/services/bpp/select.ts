import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

import {
	SERVICES_EXAMPLES_PATH,
	responseBuilder,
	quoteCreatorService,
	quoteCreatorServiceCustomized,
	checkIfCustomized,
	redis,
} from "../../../lib/utils";
import path from "path";
import fs from "fs";
import YAML from "yaml";

export const selectController = (req: Request, res: Response, next: NextFunction) => {
	const { scenario } = req.query;
	switch (scenario) {
		// schedule_confirmed, schedule_rejected
		case "schedule_confirmed":
			if (checkIfCustomized(req.body.message.order.items)) {
				return selectServiceCustomizationConfirmedController(req, res, next);
			}
			selectConsultationConfirmController(req, res, next);
			break;
		case "schedule_rejected ":
			selectConsultationRejectController(req, res, next);
			break;
		default:
			if (checkIfCustomized(req.body.message.order.items)) {
				return selectServiceCustomizationConfirmedController(req, res, next);
			}
			return selectConsultationConfirmController(req, res, next);
	}
};

const selectConsultationConfirmController = (req: Request, res: Response, next: NextFunction) => {
	const { context, message } = req.body;
	const { locations, ...provider } = message.order.provider;
	var responseMessage = {
		order: {
			provider,
			payments: message.order.payments.map(({ type }: { type: string }) => ({
				type,
				collected_by: "BAP",
			})),
			items: message.order.items.map(
				({ ...remaining }: { location_ids: any; remaining: any }) => ({
					...remaining,
					fulfillment_ids: [uuidv4()],
				})
			),
			fulfillments: message.order.fulfillments.map(
				({ id, stops, ...each }: any) => ({
					...each,
					id,
					tracking: false,
					state: {
						descriptor: {
							code: "Serviceable",
						},
					},
					stops: stops.map((stop: any) => {
						stop.time.label = "confirmed";
						stop.tags = {
							descriptor: {
								code: "schedule",
							},
							list: [
								{
									descriptor: {
										code: "ttl",
									},
									value: "PT1H",
								},
							],
						};
						// else
						// stop.time.label = "rejected"
						return stop;
					}),
				})
			),
			quote: quoteCreatorService(message.order.items),
		},
	};

	return responseBuilder(
		res,
		next,
		context,
		responseMessage,
		`${req.body.context.bap_uri}${req.body.context.bap_uri.endsWith("/") ? "on_select" : "/on_select"
		}`,
		`on_select`,
		"services"
	);
};

const selectConsultationRejectController = (req: Request, res: Response, next: NextFunction) => {
	const { context } = req.body;
	const file = fs.readFileSync(
		path.join(
			SERVICES_EXAMPLES_PATH,
			"on_select/on_select_consultation_rejected.yaml"
		)
	);
	const response = YAML.parse(file.toString());

	return responseBuilder(
		res,
		next,
		context,
		response.value.message,
		`${context.bap_uri}/on_select`,
		`on_select`,
		"services"
	);
};

const selectServiceCustomizationConfirmedController = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { context, message } = req.body;
	const { locations, ...provider } = message.order.provider;
	const { id, parent_item_id, location_ids, quantity, ...item } = message.order.items[0];
	// console.log("Items ::", message.order.items[0])

	const transactionKeys = await redis.keys(`${context.transaction_id}-*`);
	const ifTransactionToExist = transactionKeys.filter((e) =>
		e.includes("on_search-to-server")
	);

	const ifTransactionFromExist = transactionKeys.filter((e) =>
		e.includes("on_search-from-server")
	);

	const raw = await redis.mget(
		ifTransactionToExist ? ifTransactionToExist : ifTransactionFromExist
	);
	const onSearchHistory = raw.map((ele) => {
		return JSON.parse(ele as string);
	})[0].request;

	const fulfillment = message.order.fulfillments[0];

	const fulfillment_id = onSearchHistory.message.catalog.fulfillments.filter(
		(e: { type: string }) => e.type === fulfillment.type
	)[0].id;

	const responseMessage = {
		order: {
			provider,
			payments: message.order.payments.map(({ type }: { type: string }) => ({
				type,
				collected_by: "BAP",
			})),
			items: [
				{ id, parent_item_id, location_ids, quantity, fulfillment_ids: [uuidv4()] },
				...message.order.items.slice(1).map(({ location_ids, ...remaining }:
					{ location_ids: any; remaining: any; }) => ({ ...remaining, location_ids, fulfillment_ids: [uuidv4()] })
				)
			],
			fulfillments:
				// message.order.fulfillments.map(
				// 	({ stops, type, ...each }: any) => ({
				// 		id: fulfillment_id,
				// 		type,
				// 		tracking: false,
				// 		state: {
				// 			descriptor: {
				// 				code: "Serviceable",
				// 			},
				// 		},
				// 		stops,
				// 	})
				// )
				[{
					...fulfillment,
					id: fulfillment_id,
					tracking: false,
					state: {
						descriptor: {
							code: "Serviceable",
						},
					},
					stops: fulfillment.stops.map((e: { time: any; }) => ({ ...e, time: { ...e.time, label: "confirmed" } }))
				}],
			quote: quoteCreatorServiceCustomized(message.order.items),
		},
	};

	return responseBuilder(
		res,
		next,
		context,
		responseMessage,
		`${context.bap_uri}/on_select`,
		`on_select`,
		"services"
	);
};

// const selectServiceConfirmController = (req: Request, res: Response) => {
// 	const { context } = req.body;
// 	const file = fs.readFileSync(
// 		path.join(
// 			SERVICES_EXAMPLES_PATH,
// 			"on_select/on_select_service_confirmed.yaml"
// 		)
// 	);
// 	const response = YAML.parse(file.toString());

// 	return responseBuilder(
// 		res,
// 		context,
// 		response.value.message,
// 		`${req.body.context.bap_uri}${req.body.context.bap_uri.endsWith("/") ? "on_select" : "/on_select"
// 		}`,
// 		`on_select`,
// 		"services"
// 	);
// };

// const selectServiceRejectController = (req: Request, res: Response) => {
// 	const { context } = req.body;
// 	const file = fs.readFileSync(
// 		path.join(
// 			SERVICES_EXAMPLES_PATH,
// 			"on_select/on_select_service_rejected.yaml"
// 		)
// 	);
// 	const response = YAML.parse(file.toString());

// 	return responseBuilder(
// 		res,
// 		context,
// 		response.value.message,
// 		`${req.body.context.bap_uri}${req.body.context.bap_uri.endsWith("/") ? "on_select" : "/on_select"
// 		}`,
// 		`on_select`,
// 		"services"
// 	);
// };

// const selectNackController = (req: Request, res: Response) => {
// 	const { context } = req.body;
// 	const file = fs.readFileSync(
// 		path.join(SERVICES_EXAMPLES_PATH, "on_select/on_select_nack.yaml")
// 	);
// 	const response = YAML.parse(file.toString());

// 	return responseBuilder(
// 		res,
// 		context,
// 		response.value.message,
// 		`${req.body.context.bap_uri}${req.body.context.bap_uri.endsWith("/") ? "on_select" : "/on_select"
// 		}`,
// 		`on_select`,
// 		"services"
// 	);
// };
