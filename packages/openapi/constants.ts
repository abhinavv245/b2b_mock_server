export const USER_GUIDE_LINK = "";

export const B2B_SCENARIOS = {
	select: [
		{
			name: "RFQ",
			scenario: "rfq", // Select Domestic
		},
		{
			name: "Non-RFQ",
			scenario: "non-rfq",
		},
	],
	on_select: [
		{
			name: "Default",
			scenario: "default",
		},
		{
			name: "Non Serviceable",
			scenario: "non-serviceable",
		},
		{
			name: "Quantity Unavailable",
			scenario: "quantity-unavailable",
		},
	],
	init: [
		{
			name: "On Fulfillment",
			scenario: "on-fulfillment", //default
		},
		{
			name: "Prepaid Payment Collected By BPP",
			scenario: "prepaid-bpp-payment",
		},
		{
			name: "Prepaid Payment Collected By BAP",
			scenario: "prepaid-bap-payment",
		},
	],
	on_confirm: [
		{
			name: "Default",
			scenario: "default",
		},
		{
			name: "Cancelled",
			scenario: "cancelled",
		},
	],
	on_status: [
		{
			name: "BPP Payment-Success",
			scenario: "bpp-payment",
		},
		{
			name: "BPP Payment-Error",
			scenario: "bpp-payment-error",
		},
		{
			name: "Delivered",
			scenario: "delivered",
		},
		{
			name: "Out for Delivery",
			scenario: "out-for-delivery",
		},
		{
			name: "Pickup Up",
			scenario: "picked-up",
		},
		{
			name: "Proforma Invoice",
			scenario: "proforma-invoice",
		},
		{
			name: "Self Pickup",
			scenario: "self-picked-up",
		},
	],
	on_update: [
		{
			name: "Fulfillments",
			scenario: "fulfillment", // default
		},
		{
			name: "Prepaid BAP",
			scenario: "prepaid-bap",
		},
		{
			name: "Prepaid",
			scenario: "prepaid",
		},
	],
};

export const SERVICES_SCENARIOS = {
	// select: [
	// 	{
	// 		name: "Selections",
	// 		scenario: "selection",
	// 	},
	// 	{
	// 		name: "Customization",
	// 		scenario: "customization",
	// 	},
	// ],
	on_select: [
		{
			name: "Schedule Confirmed",
			scenario: "schedule_confirmed",
		},
		{
			name: "Schedule Rejected",
			scenario: "schedule_rejected",
		},
	],
	// init: [
	// 	{
	// 		name: "Service",
	// 		scenario: "service",
	// 	},
	// ],
	on_init: [
		{
			name: "Service",
			scenario: "service",
		},
	],
	// confirm: [
	// 	{
	// 		name: "Service",
	// 		scenario: "service",
	// 	},
	// ],
	on_confirm: [
		{
			name: "Service",
			scenario: "service",
		},
	],
	on_status: [
		{
			name: "Completed",
			scenario: "completed",
		},
		{
			name: "In Transit",
			scenario: "in-transit",
		},
		{
			name: "Reached Re-OTP",
			scenario: "reached-re-otp",
		},
		{
			name: "Reached",
			scenario: "reached",
		},
		{
			name: "Service Started",
			scenario: "service-started",
		},
	],
	on_update: [
		{
			name: "Requote",
			scenario: "requote",
		},
		{
			name: "Reschedule",
			scenario: "reschedule",
		},
	],
	on_cancel: [
		{
			name: "ACK",
			scenario: "ack",
		},
		{
			name: "Merchant",
			scenario: "merchant",
		},
	],
};

export const DOMAINS = {
	b2b: "B2B",
	services: "Services - Home Services",
};

export const NEXT_ACTION = {
	search: "on_search",
	on_search: "select",
	select: "on_select",
	on_select: "init",
	init: "on_init",
	on_init: "confirm",
	confirm: "on_confirm",
	update: "on_update",
	status: "on_status",
	cancel: "on_cancel",
};

export const PREV_ACTION = {
	on_search: "search",
	select: "on_search",
	on_select: "select",
	init: "on_select",
	on_init: "init",
	confirm: "on_init",
	on_confirm: "confirm",
	status: "on_confirm",
	on_status: "status",
	cancel: "on_confirm",
	on_cancel: "cancel",
	update: "on_confirm",
	on_update: "update",
};
