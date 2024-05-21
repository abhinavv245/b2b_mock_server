import { NextFunction, Request, Response } from "express";
import { SERVICES_EXAMPLES_PATH, checkIfCustomized, quoteCreatorService, responseBuilder } from "../../../lib/utils";
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { v4 as uuidv4 } from "uuid";

export const onInitController = (req: Request, res: Response, next: NextFunction) => {
	if (checkIfCustomized(req.body.message.order.items)) {
		return onInitServiceCustomizedController(req, res, next);
	}
	onInitConsultationController(req, res, next)
	// const { scenario } = req.query
	// switch (scenario) {
	// 	case 'consultation':
	// 		onInitConsultationController(req, res)
	// 		break;
	// 	case 'service':
	// 		onInitServiceController(req, res)
	// 		break;
	// 	default:
	// 		res.status(404).json({
	// 			message: {
	// 				ack: {
	// 					status: "NACK",
	// 				},
	// 			},
	// 			error: {
	// 				message: "Invalid scenario",
	// 			},
	// 		});
	// 		break;
	// }
};

const onInitConsultationController = (req: Request, res: Response, next: NextFunction) => {
	const { context, message: { order: { provider, locations, items, billing, fulfillments, payments, xinput } } } = req.body;
	const { stops, ...remainingfulfillments } = fulfillments[0]

	const file = fs.readFileSync(
		path.join(SERVICES_EXAMPLES_PATH, "confirm/confirm_consultation.yaml")
	);
	const response = YAML.parse(file.toString());

	const responseMessage = {
		order: {
			id: uuidv4(),
			status: response.value.message.order.status,
			provider: {
				...provider,
				...locations
			},
			items,
			billing,
			fulfillments: [{
				...remainingfulfillments,
				stops: stops.map(({ tags, ...stop }: { tags: any }) => {
					return {
						...stop,
						customer: {
							"person": {
								"name": "Ramu"
							}
						}
					}
				})
			}],
			quote: quoteCreatorService(items),
			payments: [{
				...payments[0],
				status: "PAID"
			}],
			"created_at": "2023-02-03T09:30:00.000Z",
			"updated_at": "2023-02-03T09:30:00.000Z",
			xinput
		}
	}
	return responseBuilder(
		res,
		next,
		context,
		responseMessage,
		`${context.bpp_uri}${context.bpp_uri.endsWith("/") ? "confirm" : "/confirm"
		}`,
		`confirm`,
		"services"
	);
};

const onInitServiceCustomizedController = (req: Request, res: Response, next: NextFunction) => {
	const { context, message: { order: { provider, locations, items, billing, fulfillments, payments, xinput } } } = req.body;
	const { stops, ...remainingfulfillments } = fulfillments[0]

	const file = fs.readFileSync(
		path.join(SERVICES_EXAMPLES_PATH, "confirm/confirm_consultation.yaml")
	);
	const response = YAML.parse(file.toString());

	const responseMessage = {
		order: {
			id: uuidv4(),
			status: response.value.message.order.status,
			provider: {
				...provider,
				locations: [locations[0]]
			},
			items,
			billing,
			fulfillments: [{
				...remainingfulfillments,
				stops: stops.map(({ tags, ...stop }: { tags: any }) => {
					return {
						...stop,
						customer: {
							"person": {
								"name": "Ramu"
							}
						}
					}
				})
			}],
			quote: quoteCreatorService(items),
			payments: [{
				...payments[0],
				status: "PAID"
			}],
			"created_at": "2023-02-03T09:30:00.000Z",
			"updated_at": "2023-02-03T09:30:00.000Z",
			xinput
		}
	}
	return responseBuilder(
		res,
		next,
		context,
		responseMessage,
		`${context.bpp_uri}${context.bpp_uri.endsWith("/") ? "confirm" : "/confirm"
		}`,
		`confirm`,
		"services"
	);
};

// const onInitServiceController = (req: Request, res: Response) => {
// 	const { context } = req.body;
// 	const file = fs.readFileSync(
// 		path.join(SERVICES_EXAMPLES_PATH, "confirm/confirm_service.yaml")
// 	);
// 	const response = YAML.parse(file.toString());
// 	return responseBuilder(
// 		res,
// 		context,
// 		response.value.message,
// 		`${context.bpp_uri}${context.bpp_uri.endsWith("/") ? "confirm" : "/confirm"
// 		}`,
// 		`confirm`,
// 		"services"
// 	);
// };

