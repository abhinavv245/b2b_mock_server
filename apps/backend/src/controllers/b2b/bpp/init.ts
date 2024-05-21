import { NextFunction, Request, Response } from "express";
import {
	quoteCreator,
	responseBuilder,
	B2B_EXAMPLES_PATH,
	redis,
} from "../../../lib/utils";
import fs from "fs";
import path from "path";
import YAML from "yaml";

export const initController = async (req: Request, res: Response, next: NextFunction) => {
	const { transaction_id } = req.body.context;
	const transactionKeys = await redis.keys(`${transaction_id}-*`);

	// checking on_select response exits or not 
	const ifTransactionExist = transactionKeys.filter((e) =>
		e.includes("on_select-from-server")
	);

	if (ifTransactionExist.length === 0) {
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
	//
	const ifToTransactionExist = transactionKeys.filter((e) =>
		e.includes("on_search-to-server")
	);

	const ifFromTransactionExist = transactionKeys.filter((e) =>
		e.includes("on_search-from-server")
	);

	if (
		ifFromTransactionExist.length === 0 &&
		ifToTransactionExist.length === 0
	) {
		return res.status(400).json({
			message: {
				ack: {
					status: "NACK",
				},
			},
			error: {
				message: "on search doesn't exist",
			},
		});
	}
	const transaction = await redis.mget(
		ifFromTransactionExist.length > 0
			? ifFromTransactionExist
			: ifToTransactionExist
	);
	const parsedTransaction = transaction.map((ele) => {
		return JSON.parse(ele as string);
	});

	const providers = parsedTransaction[0].request.message.catalog.providers;
	const item_id_name = providers.map((pro: any) => {
		const mappedItems = pro.items.map((item: any) => ({
			id: item.id,
			name: item.descriptor.name,
		}));
		return mappedItems;
	});

	req.body.item_arr = item_id_name.flat();

	// const { scenario } = req.query;
	// switch (scenario) {
	// case "default":
	// 	initDomesticController(req, res);
	// 	break;
	// // case "reject-rfq":
	// // 	initRejectRfq(req, res);
	// // 	break;
	// default:
	initDomesticController(req, res, next);
	// 		break;
	// }
};

const initDomesticController = (req: Request, res: Response, next: NextFunction) => {
	const { context, message } = req.body;
	const { items, fulfillments, tags, billing, ...remainingMessage } =
		message.order;

	const file = fs.readFileSync(
		path.join(B2B_EXAMPLES_PATH, "on_init/on_init_domestic.yaml")
	);

	const response = YAML.parse(file.toString());
	let { type, collected_by, ...staticPaymentInfo } =
		response.value.message.order.payments[0];
	if (
		remainingMessage.payments[0].type === "PRE-FULFILLMENT" &&
		remainingMessage.payments[0].collected_by === "BAP"
	) {
		staticPaymentInfo = {
			...staticPaymentInfo,
			"@ondc/org/settlement_details": [
				{
					settlement_counterparty: "buyer-app",
					settlement_phase: "sale-amount",
					settlement_type: "upi",
					upi_address: "gft@oksbi",
					settlement_bank_account_no: "XXXXXXXXXX",
					settlement_ifsc_code: "XXXXXXXXX",
					beneficiary_name: "xxxxx",
					bank_name: "xxxx",
					branch_name: "xxxx",
				},
			],
		};
	}
	const responseMessage = {
		order: {
			items,
			fulfillments: fulfillments.map((each: any) => ({
				...each,
				tracking: true,
			})),
			tags: [
				...tags,
				{
					descriptor: {
						code: "bpp_terms",
					},
					list: [
						{
							descriptor: {
								code: "max_liability",
							},
							value: "2",
						},
						{
							descriptor: {
								code: "max_liability_cap",
							},
							value: "10000",
						},
						{
							descriptor: {
								code: "mandatory_arbitration",
							},
							value: "false",
						},
						{
							descriptor: {
								code: "court_jurisdiction",
							},
							value: "Bengaluru",
						},
						{
							descriptor: {
								code: "delay_interest",
							},
							value: "1000",
						},
					],
				},
			],
			billing,
			provider: { id: remainingMessage.provider.id },
			provider_location: remainingMessage.provider.locations[0],
			payments: remainingMessage.payments.map((each: any) => ({
				...each,
				...staticPaymentInfo,
			})),
			quote: quoteCreator(items),
		},
	};

	try {
		responseMessage.order.quote.breakup.forEach((element: any) => {
			if (element["@ondc/org/title_type"] === "item") {
				const id = element["@ondc/org/item_id"];
				const item = req.body.item_arr.find((item: any) => item.id == id);
				element.title = item.name;
			}
		});
	} catch (error) {

		return res.status(400).json({
			message: {
				ack: {
					status: "NACK",
				},
			},
			error: {
				message: "Item Name and ID not matching",
			},
		});
	}
	return responseBuilder(
		res,
		next,
		context,
		responseMessage,
		`${req.body.context.bap_uri}${
			req.body.context.bap_uri.endsWith("/") ? "on_init" : "/on_init"
		}`,
		`on_init`,
		"b2b"
	);
};
