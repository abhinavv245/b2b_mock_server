import { Request, Response } from "express";
import { responseBuilder, B2B_EXAMPLES_PATH, redis } from "../../../lib/utils";
import { on } from "events";
// import fs from "fs";
// import path from "path";
// import YAML from "yaml";

// export const updateController = (req: Request, res: Response) => {
//  const { scenario } = req.query;
//  switch (scenario) {
//      case "fulfillment":
//          updateFulfillmentController(req, res);
//          break;
//      case "prepaid":
//          updatePrepaidController(req, res);
//          break;
//      case "prepaid-bap":
//          updatePrepaidBAPController(req, res);
//          break;
//      default:
//          res.status(404).json({
//              message: {
//                  ack: {
//                      status: "NACK",
//                  },
//              },
//              error: {
//                  message: "Invalid scenario",
//              },
//          });
//          break;
//  }
// };

// export const updateFulfillmentController = (req: Request, res: Response) => {
//  const file = fs.readFileSync(
//      path.join(B2B_EXAMPLES_PATH, "on_update/on_update_fulfillments.yaml")
//  );

//  const response = YAML.parse(file.toString());
//  return responseBuilder(
//      res,
//      req.body.context,
//      response.value.message,
//      `${req.body.context.bap_uri}${
//          req.body.context.bap_uri.endsWith("/") ? "on_update" : "/on_update"
//      }`,
//      `on_update`,
//      "b2b"
//  );
// };

// export const updatePrepaidController = (req: Request, res: Response) => {
//  const file = fs.readFileSync(
//      path.join(B2B_EXAMPLES_PATH, "on_update/on_update_prepaid.yaml")
//  );

//  const response = YAML.parse(file.toString());
//  return responseBuilder(
//      res,
//      req.body.context,
//      response.value.message,
//      `${req.body.context.bap_uri}${
//          req.body.context.bap_uri.endsWith("/") ? "on_update" : "/on_update"
//      }`,
//      `on_update`,
//      "b2b"
//  );
// };

// export const updatePrepaidBAPController = (req: Request, res: Response) => {
//  const file = fs.readFileSync(
//      path.join(B2B_EXAMPLES_PATH, "on_update/on_update_prepaid_BAP.yaml")
//  );

//  const response = YAML.parse(file.toString());
//  return responseBuilder(
//      res,
//      req.body.context,
//      response.value.message,
//      `${req.body.context.bap_uri}${
//          req.body.context.bap_uri.endsWith("/") ? "on_update" : "/on_update"
//      }`,
//      `on_update`,
//      "b2b"
//  );
// };

export const updateController = async (req: Request, res: Response) => {
	const { scenario } = req.query
	const update = req.body

	let on_update = {
		context: {
			...update.context,
			action: "on_update"
		},
		message: {
			order: {
				...update.message.order,

				payments: update.message.order.payments.map((payment: any) => {
					return {
						...payment,
						"@ondc/org/settlement_details": payment["@ondc/org/settlement_details"].map((order: any) => ({
							...order,
							settlement_phase: "finder-fee"
						}))

					}
				})
			}
		}
	}

	switch (scenario) {
		case "fulfillment":
			on_update = await updateFulfillment(res, on_update)
			break;
		case "prepaid":
			on_update.message.order.payments.forEach((itm: any) => {
				itm.collected_by = "BPP"
				itm["@ondc/org/settlement_details"].forEach((itm: any) => {
					itm.settlement_counterparty = "buyer-app"
				})
			})
			break;
		case "prepaid-bap":
			break;
		default:
			on_update = await updateFulfillment(res, on_update)
			break;
	}
	return res.status(200).json({
		message: {
			ack: {
				status: "ACK",
			},
		},
		on_update: on_update,
	});

}
const updateFulfillment = async (res: Response, on_update: any) => {
	console.log("--", on_update)
	const { transaction_id } = on_update.context;

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
	const parsedTransaction = transaction.map((ele) => {
		return JSON.parse(ele as string);
	});
	//getting fullfiillments for on_update_fulfillments
	const { fulfillments, items } = parsedTransaction[0].request.message.order

	//get item tags based on fulfillment_ids for inserting it in message.order.fulfillment
	const result = items.reduce((acc: any, item: any) => {
		item.fulfillment_ids.forEach((id: any) => {
			acc[id] = item.tags;
		});
		return acc;
	}, {});

	console.log("Result of tags::", result)
	on_update.message.order.payments.forEach((itm: any) => {
		itm.collected_by = "BPP"
		delete itm["@ondc/org/settlement_basis"]
		delete itm["@ondc/org/settlement_window"]
		delete itm["@ondc/org/withholding_amount"]
		itm["@ondc/org/settlement_details"].forEach((itm: any) => {
			itm.settlement_counterparty = "buyer-app"
			itm.settlement_phase = "sale-amount"
		})
	})

	on_update.message.order.fulfillments = fulfillments.map((fulfillment: any) => ({
		...fulfillment,
		stops: fulfillment.stops.map((stop: any) => ({
			...stop,
			instructions: stop.type === "end" ? {
				name: "Status for drop",
				short_desc: "Delivery Confirmation Code"
			} : stop.instructions
		})),
		tags: result[fulfillment.id].concat([
			{
				descriptor: {
					code: "MEASURE_UNIT"
				},
				value: "millilitre"
			},
			{
				descriptor: {
					code: "MEASURE_VALUE"
				},
				value: "500"
			}
		])
	}))
	return on_update
}

