import { NextFunction, Request, Response } from "express";
import { SERVICES_EXAMPLES_PATH, checkIfCustomized, responseBuilder } from "../../../lib/utils";
import fs from "fs";
import path from "path";
import YAML from "yaml";

export const onSearchController = (req: Request, res: Response, next: NextFunction) => {
	const { scenario } = req.query;
	switch (scenario) {
		case "selection":
			if (checkIfCustomized(req.body.message.catalog.providers[0].items)) { // check "code": "attribute" only
				return onSearchServiceCustomizationController(req, res, next);
			}
			onSearchSelectionController(req, res, next);
			break;
		// case "consultation":
		// 	onSearchConsultationController(req, res);
		// 	break;
		// case "service":
		// 	onSearchServiceController(req, res);
		// 	break;
		// case "without-schedule":
		// 	onSearchWithoutScheduleController(req, res);
		// 	break;
		default:
			// res.status(404).json({
			// 	message: {
			// 		ack: {
			// 			status: "NACK",
			// 		},
			// 	},
			// 	error: {
			// 		message: "Invalid scenario",
			// 	},
			// });
			if (checkIfCustomized(req.body.message.catalog.providers[0].items)) {
				// return onSearchServiceCustomizationController(req, res);
			}
			onSearchSelectionController(req, res, next);
			break;
	}
};

const onSearchSelectionController = (req: Request, res: Response, next: NextFunction) => {
	const { context, message } = req.body;
	const { fulfillments, payments, providers } = message.catalog
	const { id, locations, ...remainingProviders } = providers[0]

	// const file = fs.readFileSync(
	// 	path.join(SERVICES_EXAMPLES_PATH, "select/select_consultation_reschedule.yaml")
	// );
	// const response = YAML.parse(file.toString());
	const resposneMessage = {
		// order: {
		// 	provider: {
		// 		id,
		// 		locations: [{
		// 			id: locations[0]?.id
		// 		}],
		// 	},
		// 	items: [providers[0]?.items.map(({ id, parent_item_id, location_ids }:
		// 		{ id: any, parent_item_id: any, location_ids: any }) => ({ id, parent_item_id, location_ids: [{ id: location_ids[0] }] }))[0]],
		// 	fulfillments: [
		// 		{
		// 			type: fulfillments[0].type,
		// 			stops: [
		// 				{
		// 					"type": "end",
		// 					"location":
		// 					{
		// 						"gps": "12.974002,77.613458",
		// 						"area_code": "560001"
		// 					},
		// 					"time": {
		// 						"label": "selected",
		// 						"range": { // should be dynamic on the basis of scehdule
		// 							"start": providers[0].time.schedule.times[0],
		// 							"end": providers[0].time.schedule.times[1]
		// 						}
		// 					}
		// 				}
		// 			]
		// 		}
		// 	],
		// 	payments: [{ type: payments[0].type }]
		// }
	}

	return responseBuilder(
		res,
		next,
		context,
		resposneMessage,
		`${context.bpp_uri}${context.bpp_uri.endsWith("/") ? "select" : "/select"}`,
		`select`,
		"services"
	);
};

const onSearchServiceCustomizationController = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	// const { context, message: { catalog: { providers, fulfillments, payments } } } = req.body;
	// const { id, locations, items, categories, ...remainingProviders } = providers[0]
	// const { id: parent_item_id, location_ids, ...item } = items[0]

	// // const file = fs.readFileSync(
	// // 	path.join(SERVICES_EXAMPLES_PATH, "select/select_service_customization.yaml")
	// // );
	// // const response = YAML.parse(file.toString());
	// const responseMessage = {
	// 	order: {
	// 		provider: {
	// 			id,
	// 			locations: [{
	// 				id: locations[0]?.id
	// 			}],
	// 		},
	// 		fulfillments: [
	// 			{
	// 				type: fulfillments[0].type,
	// 				stops: [
	// 					{
	// 						"type": "end",
	// 						"location":
	// 						{
	// 							"gps": "12.974002,77.613458",
	// 							"area_code": "560001"
	// 						},
	// 						"time": {
	// 							"label": "selected",
	// 							"range": { // should be dynamic on the basis of scehdule
	// 								// "start": providers[0].time.schedule.times[0],
	// 								// "end": providers[0].time.schedule.times[1]
	// 							}
	// 						},
	// 						"days": fulfillments[0].days?.split(',')[0] // will be from onsearch
	// 					}
	// 				]
	// 			}
	// 		],
	// 		payments: [{ type: payments[0].type }],
	// 		items: [
	// 			{ parent_item_id, location_ids },
	// 			...items.slice(1).map((item: any) => {
	// 				return {
	// 					id: item.id,
	// 					parent_item_id,
	// 					quantity: {
	// 						"selected": {
	// 							"count": 3
	// 						}
	// 					},
	// 					category_ids: item.category_ids,
	// 					tags: item.tags
	// 				}
	// 			})
	// 		]
	// 	}
	// }
	// return responseBuilder(
	// 	res,
	// 	context,
	// 	responseMessage,
	// 	`${context.bpp_uri}${context.bpp_uri.endsWith("/") ? "select" : "/select"}`,
	// 	`select`,
	// 	"services"
	// );
};

// const onSearchConsultationController = (
// 	req: Request,
// 	res: Response
// ) => {
// 	const { context } = req.body;
// 	const file = fs.readFileSync(
// 		path.join(SERVICES_EXAMPLES_PATH, "select/select_consultation.yaml")
// 	);
// 	const response = YAML.parse(file.toString());
// 	return responseBuilder(
// 		res,
// 		context,
// 		response.value.message,
// 		`${context.bpp_uri}${context.bpp_uri.endsWith("/") ? "select" : "/select"}`,
// 		`select`,
// 		"services"
// 	);
// };

// const onSearchServiceController = (
// 	req: Request,
// 	res: Response
// ) => {
// 	const { context } = req.body;
// 	const file = fs.readFileSync(
// 		path.join(SERVICES_EXAMPLES_PATH, "select/select_service.yaml")
// 	);
// 	const response = YAML.parse(file.toString());
// 	return responseBuilder(
// 		res,
// 		context,
// 		response.value.message,
// 		`${context.bpp_uri}${context.bpp_uri.endsWith("/") ? "select" : "/select"}`,
// 		`select`,
// 		"services"
// 	);
// };

// const onSearchWithoutScheduleController = (req: Request, res: Response) => {
// 	const { context } = req.body;
// 	const file = fs.readFileSync(
// 		path.join(SERVICES_EXAMPLES_PATH, "select/select_without_schedule.yaml")
// 	);
// 	const response = YAML.parse(file.toString());
// 	return responseBuilder(
// 		res,
// 		context,
// 		response.value.message,
// 		`${context.bpp_uri}${context.bpp_uri.endsWith("/") ? "select" : "/select"}`,
// 		`select`,
// 		"services"
// 	);
// };

