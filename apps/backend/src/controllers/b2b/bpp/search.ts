import { NextFunction, Request, Response } from "express";

import fs from "fs";
import path from "path";
import YAML from "yaml";
import { B2B_EXAMPLES_PATH, responseBuilder } from "../../../lib/utils";
import axios from "axios";

export const searchController = async (req: Request, res: Response, next: NextFunction) => {
	const domain = req.body.context.domain;

	var onSearch;
	switch (domain) {
		case "ONDC:RET1A":
			var file = fs.readFileSync(
				path.join(
					B2B_EXAMPLES_PATH,
					"on_search/on_search_autoparts_and_components.yaml"
				)
			);
			onSearch = YAML.parse(file.toString());
			break;
		case "ONDC:RET13":
			var file = fs.readFileSync(
				path.join(B2B_EXAMPLES_PATH, "on_search/on_search_bpc.yaml")
			);
			onSearch = YAML.parse(file.toString());
			break;
		case "ONDC:RET1D":
			var file = fs.readFileSync(
				path.join(B2B_EXAMPLES_PATH, "on_search/on_search_chemicals.yaml")
			);
			onSearch = YAML.parse(file.toString());
			break;
		case "ONDC:RET1C":
			var file = fs.readFileSync(
				path.join(
					B2B_EXAMPLES_PATH,
					"on_search/on_search_construction_and_building.yaml"
				)
			);
			onSearch = YAML.parse(file.toString());
			break;
		case "ONDC:RET14":
			var file = fs.readFileSync(
				path.join(
					B2B_EXAMPLES_PATH,
					"on_search/on_search_electronics_mobile.yaml"
				)
			);
			onSearch = YAML.parse(file.toString());
			break;
		// case "ONDC:RET14":
		// 	var file = fs.readFileSync(
		// 		path.join(B2B_EXAMPLES_PATH, "on_search/on_search_electronics.yaml")
		// 	);
		// 	onSearch = YAML.parse(file.toString());
		// 	break;
		case "ONDC:RET12":
			var file = fs.readFileSync(
				path.join(B2B_EXAMPLES_PATH, "on_search/on_search_fashion.yaml")
			);
			onSearch = YAML.parse(file.toString());
			break;
		case "ONDC:RET10":
			var file = fs.readFileSync(
				path.join(B2B_EXAMPLES_PATH, "on_search/on_search_grocery.yaml")
			);
			onSearch = YAML.parse(file.toString());
			break;
		case "ONDC:RET1B":
			var file = fs.readFileSync(
				path.join(
					B2B_EXAMPLES_PATH,
					"on_search/on_search_hardware_and_industrial.yaml"
				)
			);
			onSearch = YAML.parse(file.toString());
			break;
		// case "ONDC:RET1D":
		// 	var file = fs.readFileSync(
		// 		path.join(B2B_EXAMPLES_PATH, "on_search/on_search_payment_BPP.yaml")
		// 	);
		// 	onSearch = YAML.parse(file.toString());
		// 	break;
		default:
			var file = fs.readFileSync(
				path.join(B2B_EXAMPLES_PATH, "on_search/on_search.yaml")
			);
			onSearch = YAML.parse(file.toString());
			break;
	}

	return responseBuilder(
		res,
		next,
		req.body.context,
		onSearch.value.message,
		`${req.body.context.bap_uri}${
			req.body.context.bap_uri.endsWith("/") ? "on_search" : "/on_search"
		}`,
		`on_search`,
		"b2b"
	);
};
