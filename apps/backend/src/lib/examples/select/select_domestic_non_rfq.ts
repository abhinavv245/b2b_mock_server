export const selectDomesticNonRFQ = {
  context: {
    domain: "ONDC:RET10",
    location: {
      city: {
        code: "std:080"
      },
      country: {
        code: "IND"
      }
    },
    action: "select",
    version: "2.0.2",
    bap_id: "buyerapp.com",
    bap_uri: "https://buyerapp.com/grocery",
    bpp_id: "sellerapp.com",
    bpp_uri: "https://sellerapp.com/grocery",
    transaction_id: "9568beb3-265a-4730-be4e-c00ba2e5e30a",
    message_id: "4e90afaf-2d02-4ed9-9659-45d702a82f8e",
    timestamp: "2023-01-08T22:00:30.000Z",
    ttl: "PT30S"
  },
  message: {
    order: {
      provider: {
        id: "P1",
        locations: [
          {
            id: "L1"
          }
        ]
      },
      items: [
        {
          id: "I1",
          location_ids: [
            "L1"
          ],
          fulfillment_ids: [
            "F1"
          ],
          quantity: {
            selected: {
              count: 200
            }
          },
          add_ons: [
            {
              id: "78787723"
            }
          ]
        }
      ],
      fulfillments: [
        {
          id: "F1",
          type: "Delivery",
          stops: [
            {
              type: "end",
              location: {
                gps: "12.974002,77.613458",
                area_code: "560001",
                city: {
                  name: "Bengaluru"
                },
                country: {
                  code: "IND"
                },
                state: {
                  name: "Karnataka"
                }
              },
              contact: {
                phone: "9886098860"
              }
            }
          ]
        }
      ],
      payments: [
        {
          type: "ON-FULFILLMENT"
        }
      ],
      tags: [
        {
          descriptor: {
            code: "buyer_id"
          },
          list: [
            {
              descriptor: {
                code: "buyer_id_code"
              },
              value: "gst"
            },
            {
              descriptor: {
                code: "buyer_id_no"
              },
              value: "12345678"
            }
          ]
        }
      ]
    }
  }
}