import { NextFunction, Request, Response } from "express";
import { SERVICES_EXAMPLES_PATH, checkIfCustomized, responseBuilder } from "../../../lib/utils";
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { v4 as uuidv4 } from "uuid";

export const onSelectController = (req: Request, res: Response, next: NextFunction) => {
	if (checkIfCustomized(req.body.message.order.items)) {
		return onSelectServiceCustomizedController(req, res, next);
	}
	return onSelectConsultationController(req, res, next);

	// const { scenario } = req.query
	// switch (scenario) {
	// 	case "consultation":
	// 		break;
	// 	case "service":
	// 		onSelectServiceController(req, res);
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

const onSelectConsultationController = (req: Request, res: Response, next: NextFunction) => {
	const { context, message:
		{ order: { provider, items, payments, fulfillments
		} } } = req.body;

	const { id, type, stops } = fulfillments[0]
	// const file = fs.readFileSync(
	// 	path.join(SERVICES_EXAMPLES_PATH, "init/init_consultation.yaml")
	// );
	// const response = YAML.parse(file.toString());
	const responseMessage = {
		order: {
			provider: {
				...provider,
				locations: [{ id: uuidv4() }]
			},
			items: items.map(({ location_ids, ...items }: { location_ids: any }) => items),
			billing: {
				"name": "ONDC buyer",
				"address": "22, Mahatma Gandhi Rd, Craig Park Layout, Ashok Nagar, Bengaluru, Karnataka 560001",
				"state": {
					"name": "Karnataka"
				},
				"city": {
					"name": "Bengaluru"
				},
				"tax_id": "XXXXXXXXXXXXXXX",
				"email": "nobody@nomail.com",
				"phone": "9886098860"
			},
			fulfillments: [{
				id,
				type,
				stops: [
					{
						id: stops[0].id,
						"location": {
							"gps": "12.974002,77.613458",
							"address": "My House #, My buildin",
							"city": {
								"name": "Bengaluru"
							},
							"country": {
								"code": "IND"
							},
							"area_code": "560001",
							"state": {
								"name": "Karnataka"
							}
						},
						"contact": {
							"phone": "9886098860"
						},
						time: stops[0].time
					}
				]
			}],
			payments
		}
	}
	return responseBuilder(
		res,
		next,
		context,
		responseMessage,
		`${req.body.context.bpp_uri}${req.body.context.bpp_uri.endsWith("/") ? "init" : "/init"}`,
		`init`,
		"services"
	);
};

const onSelectServiceCustomizedController = (req: Request, res: Response, next: NextFunction) => {
	const { context, message:
		{ order: { provider, items, payments, fulfillments
		} } } = req.body;

	const { id, type, stops } = fulfillments[0]
	const { id: parent_item_id, location_ids, ...item } = items[0]
	// const file = fs.readFileSync(
	// 	path.join(SERVICES_EXAMPLES_PATH, "init/init_consultation.yaml")
	// );
	// const response = YAML.parse(file.toString());
	const responseMessage = {
		order: {
			provider: {
				...provider,
				locations: [{ id: uuidv4() }]
			},
			items: [
				items[0],
				...items.slice(1).map(({ location_ids, ...item }: { location_ids: any }) => {
					return {
						...item,
						quantity: {
							measure: {
								"unit": "unit",
								"value": "1"
							}

						}
					}
				})
			],
			billing: {
				"name": "ONDC buyer",
				"address": "22, Mahatma Gandhi Rd, Craig Park Layout, Ashok Nagar, Bengaluru, Karnataka 560001",
				"state": {
					"name": "Karnataka"
				},
				"city": {
					"name": "Bengaluru"
				},
				"tax_id": "XXXXXXXXXXXXXXX",
				"email": "nobody@nomail.com",
				"phone": "9886098860"
			},
			fulfillments: [{
				id,
				type,
				stops: [
					{
						// id: stops[0].id,
						"location": {
							"gps": "12.974002,77.613458",
							"address": "My House #, My buildin",
							"city": {
								"name": "Bengaluru"
							},
							"country": {
								"code": "IND"
							},
							"area_code": "560001",
							"state": {
								"name": "Karnataka"
							}
						},
						"contact": {
							"phone": "9886098860"
						},
						time: stops[0].time
					}
				]
			}],
			payments
		}
	}
	return responseBuilder(
		res,
		next,
		context,
		responseMessage,
		`${req.body.context.bpp_uri}${req.body.context.bpp_uri.endsWith("/") ? "init" : "/init"}`,
		`init`,
		"services"
	);
};

// const onSelectServiceController = (
// 	req: Request,
// 	res: Response
// ) => {
// 	const { context } = req.body;
// 	const file = fs.readFileSync(
// 		path.join(SERVICES_EXAMPLES_PATH, "init/init_service.yaml")
// 	);
// 	const response = YAML.parse(file.toString());
// 	return responseBuilder(
// 		res,
// 		context,
// 		response.value.message,
// 		`${req.body.context.bpp_uri}${req.body.context.bpp_uri.endsWith("/") ? "init" : "/init"}`,
// 		`init`,
// 		"services"
// 	);
// };
