import { NextFunction, Request, Response } from "express";

import { SERVICES_EXAMPLES_PATH, checkIfCustomized, responseBuilder } from "../../../lib/utils";
import fs from "fs";
import path from "path";
import YAML from "yaml";

export const statusController = (req: Request, res: Response, next: NextFunction) => {
	const { scenario } = req.query
	switch (scenario) {
		case 'completed':
			statusCompletedController(req, res, next)
			break;
		case 'in-transit':
			statusInTransitController(req, res, next)
			break;
		case 'reached-re-otp':
			statusReachedReOtpController(req, res, next)
			break;
		case 'reached':
			statusReachedController(req, res, next)
			break;
		case 'service-started':
			if (checkIfCustomized(req.body.message.providers[0].items)) {
				// return onSelectServiceCustomizedController(req, res);
			}
			statusServiceStartedController(req, res, next)
			break;
		default:
			statusCompletedController(req, res, next)//default senario : completed
			break;
	}
}

const statusCompletedController = (req: Request, res: Response, next: NextFunction) => {
	const { context } = req.body;
	const file = fs.readFileSync(
		path.join(SERVICES_EXAMPLES_PATH, "on_status/on_status_Completed.yaml")
	);
	const response = YAML.parse(file.toString());
	return responseBuilder(
		res,
		next,
		context,
		response.value.message,
		`${req.body.context.bap_uri}${req.body.context.bap_uri.endsWith("/") ? "on_status" : "/on_status"
		}`,
		`on_status`,
		"services"
	);
};

const statusInTransitController = (req: Request, res: Response, next: NextFunction) => {
	const { context } = req.body;
	const file = fs.readFileSync(
		path.join(SERVICES_EXAMPLES_PATH, "on_status/on_status_In_Transit.yaml")
	);
	const response = YAML.parse(file.toString());
	return responseBuilder(
		res,
		next,
		context,
		response.value.message,
		`${req.body.context.bap_uri}${req.body.context.bap_uri.endsWith("/") ? "on_status" : "/on_status"
		}`,
		`on_status`,
		"services"
	);
};

const statusReachedReOtpController = (req: Request, res: Response, next: NextFunction) => {
	const { context } = req.body;
	const file = fs.readFileSync(
		path.join(SERVICES_EXAMPLES_PATH, "on_status/on_status_Reached_re-otp.yaml")
	);
	const response = YAML.parse(file.toString());
	return responseBuilder(
		res,
		next,
		context,
		response.value.message,
		`${req.body.context.bap_uri}${req.body.context.bap_uri.endsWith("/") ? "on_status" : "/on_status"
		}`,
		`on_status`,
		"services"
	);
};
const statusReachedController = (
	req: Request,
	res: Response,
	next: NextFunction

) => {
	const { context } = req.body;
	const file = fs.readFileSync(
		path.join(SERVICES_EXAMPLES_PATH, "on_status/on_status_Reached.yaml")
	);
	const response = YAML.parse(file.toString());
	return responseBuilder(
		res,
		next,
		context,
		response.value.message,
		`${req.body.context.bap_uri}${req.body.context.bap_uri.endsWith("/") ? "on_status" : "/on_status"
		}`,
		`on_status`,
		"services"
	);
};

const statusServiceStartedController = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { context } = req.body;
	const file = fs.readFileSync(
		path.join(SERVICES_EXAMPLES_PATH, "on_status/on_status_Service_Started.yaml")
	);
	const response = YAML.parse(file.toString());
	return responseBuilder(
		res,
		next,
		context,
		response.value.message,
		`${req.body.context.bap_uri}${req.body.context.bap_uri.endsWith("/") ? "on_status" : "/on_status"
		}`,
		`on_status`,
		"services"
	);
};

