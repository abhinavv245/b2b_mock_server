import { NextFunction, Request, Response } from "express";
import {
	MOCKSERVER_ID,
	SERVICES_BAP_MOCKSERVER_URL,
	checkIfCustomized,
	createAuthHeader,
	logger,
	redis,
	redisFetch,
	redisExist,
} from "../../../lib/utils";
import axios, { AxiosError } from "axios";
import { v4 as uuidv4 } from "uuid";
import { set, eq } from "lodash";
import { isBefore, addDays } from "date-fns";

export const initiateSelectController = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { transactionId } = req.body;

	// const transactionKeys = await redis.keys(`${transactionId}-*`);
	// const ifTransactionExist = transactionKeys.filter((e) =>
	// 	e.includes("on_search-to-server")
	// );

	// if (ifTransactionExist.length === 0) {
	// 	return res.status(400).json({
	// 		message: {
	// 			ack: {
	// 				status: "NACK",
	// 			},
	// 		},
	// 		error: {
	// 			message: "On search doesn't exist",
	// 		},
	// 	});
	// }
	// const transaction = await redis.mget(ifTransactionExist);
	// const parsedTransaction = transaction.map((ele) => {
	// 	return JSON.parse(ele as string);
	// });

	const on_search = await redisFetch("on_search", transactionId);
	if (!on_search) {
		return res.status(400).json({
			message: {
				ack: {
					status: "NACK",
				},
			},
			error: {
				message: "On Search doesn't exist",
			},
		});
	}
	// selecting the senarios
	let scenario = "selection";
	if (checkIfCustomized(on_search.message.catalog.providers[0].items)) {
		scenario = "customization";
	}

	const items = on_search.message.catalog.providers[0]?.categories;
	let child_ids;
	if (items) {
		const parent_id = items.find(
			(ele: any) => ele.descriptor.code === "MEAL"
		)?.id;
		child_ids = items.reduce((acc: string[], ele: any) => {
			if (ele.parent_category_id === parent_id) {
				acc.push(ele.id);
			}
			return acc;
		}, []);
	}
	req.body.child_ids = child_ids;
	return intializeRequest(req, res, next, on_search, scenario);
};

const intializeRequest = async (
	req: Request,
	res: Response,
	next: NextFunction,
	transaction: any,
	scenario: string
) => {
	const {
		context,
		message: {
			catalog: { fulfillments, payments, providers },
		},
	} = transaction;
	const { transaction_id } = context;
	const { id, locations } = providers[0];
	// const { id: item_id, parent_item_id, location_ids } = providers[0].items[0];
	let items = [];
	let start;
	let endDate;
	if (scenario === "customization") {
		const startDate = new Date(providers?.[0]?.time?.range?.start);

		const startCategory = providers?.[0]?.categories?.find((cat: any) => {
			return cat.id === req.body.child_ids[0];
		});
		const startSchedule = startCategory?.tags?.find(
			(ele: any) => ele.descriptor.code === "schedule"
		);
		const startTime = startSchedule?.list?.find(
			(ele: any) => ele.descriptor.code === "start_time"
		).value;
		const hour = Number(startTime?.split(":")[0]);
		const minutes = Number(startTime?.split(":")[1]);

		start = new Date(startDate);
		start.setUTCHours(hour, minutes, 0, 0);

		const currentDate = new Date();

		// Compare the start date with the current date and time
		if (isBefore(start, currentDate)) {
			currentDate.setUTCHours(start.getUTCHours());
			currentDate.setUTCMinutes(start.getUTCMinutes());
			currentDate.setUTCSeconds(start.getUTCSeconds());
			start = addDays(currentDate, 1);
		}

		const scheduleobj = providers[0]?.categories
			.find((itm: any) => itm.id === req.body.child_ids[0])
			?.tags.find((tag: any) => tag.descriptor.code === "schedule");

		const endDateFrequency = scheduleobj?.list.find(
			(ele: any) => ele.descriptor.code === "frequency"
		)?.value;

		const frequency = parseInt(endDateFrequency?.match(/\d+/)[0]);

		//end date
		endDate = new Date(start);
		endDate.setUTCHours(start.getUTCHours() + frequency);

		//parent_item_id not in customization
		items = [...providers[0].items];
		if (req.body.child_ids) {
			// items = items.filter(item => item.category_ids.includes(req.body.child_ids[0])).slice(0,1);
			const new_items: any[] = [];
			let count = 0;
			let index = 0;
			while (index < items.length && count < 2) {
				if (items[index].category_ids.includes(req.body.child_ids[0])) {
					if (
						new_items.length > 0 &&
						new_items[0].parent_item_id !== items[index].parent_item_id
					) {
						continue;
					}
					new_items.push(items[index]);
					count++;
				}
				index++;
			}
			const parent_item = items.find(
				(item: any) => item.id === new_items[0].parent_item_id
			);
			items = [parent_item, ...new_items];
		}
		const { id: item_id, parent_item_id, location_ids } = items[0];
		items = [
			{
				id: item_id,
				parent_item_id,
				location_ids,
				quantity: {
					selected: {
						count: 1,
					},
				},
			},
			...items.slice(1).map((item: any) => {
				return {
					// ...item,
					id: item.id,
					parent_item_id: item.parent_item_id,
					quantity: {
						selected: {
							count: 1,
						},
					},
					category_ids: item.category_ids,
					location_ids: [location_ids],
					tags: item.tags.map((tag: any) => ({
						...tag,
						list: tag.list.map((itm2: any, index: any) => {
							if (index === 0) {
								return {
									descriptor: {
										code: "type",
									},
									value: "customization",
								};
							} else {
								return itm2; // Return the item unchanged if it's not the first element
							}
						}),
					})),
				};
			}),
		];
	} else {
		items = providers[0].items = [
			providers[0]?.items.map(
				({
					id,
					parent_item_id,
					location_ids,
				}: {
					id: any;
					parent_item_id: any;
					location_ids: any;
				}) => ({ id, parent_item_id, location_ids: [{ id: location_ids[0] }] })
			)[0],
		];
	}
	// console.log("Items::", items, "Senario::", scenario)
	const select = {
		context: {
			...context,
			timestamp: new Date().toISOString(),
			action: "select",
			bap_id: MOCKSERVER_ID,
			bap_uri: SERVICES_BAP_MOCKSERVER_URL,
			message_id: uuidv4(),
		},
		message: {
			order: {
				provider: {
					id,
					locations: [
						{
							id: locations[0]?.id,
						},
					],
				},
				items: items.map((itm: any) => ({
					...itm,
					location_ids: itm.location_ids
						? itm.location_ids.map((id: any) => String(id))
						: undefined,
					quantity: {
						selected: {
							count: 1,
						},
					},
				})),
				fulfillments: [
					{
						...fulfillments[0],
						type: fulfillments[0].type,
						stops: [
							{
								type: "end",
								location: {
									gps: "12.974002,77.613458",
									area_code: "560001",
								},
								time: {
									label: "selected",
									range: {
										// should be dynamic on the basis of scehdule
										start:
											providers[0]?.time?.schedule?.times?.[0] ?? new Date(),
										end: providers[0]?.time?.schedule?.times?.[1] ?? new Date(),
									},
								},
								days: scenario === "customization" ? "4" : undefined,
								// 	? fulfillments[0].stops[0].time.days.split(",")[0]
								// 	: undefined,
							},
						],
					},
				],
				payments: [{ type: payments[0].type }],
			},
		},
	};
	if (eq(scenario, "customization")) {
		set(
			select,
			"message.order.fulfillments[0].stops[0].time.range.start",
			start
		);
		set(
			select,
			"message.order.fulfillments[0].stops[0].time.range.end",
			endDate
		);
	}

	const header = await createAuthHeader(select);
	try {
		await redis.set(
			`${transaction_id}-select-from-server`,
			JSON.stringify({ request: { ...select } })
		);
		const response = await axios.post(`${context.bpp_uri}/select`, select, {
			headers: {
				"X-Gateway-Authorization": header,
				authorization: header,
			},
		});
		await redis.set(
			`${transaction_id}-select-from-server`,
			JSON.stringify({
				request: { ...select },
				response: {
					response: response.data,
					timestamp: new Date().toISOString(),
				},
			})
		);
		return res.json({
			message: {
				ack: {
					status: "ACK",
				},
			},
			transaction_id,
		});
	} catch (error) {
		return next(error);
	}
};
