import { dedent } from "./lib/utils"
import type { Value } from "./viewers/types"

export const EXAMPLE_DATASET: {
    id: string
    content: Value
}[] = [
    {
        id: "customers",
        content: {
            type: "table",
            columns: ["id", "name", "city_id", "email", "signup_date"],
            data: [
                [
                    { type: "text", content: "c1" },
                    { type: "text", content: "Alice Johnson" },
                    { type: "text", content: "ct1" },
                    { type: "text", content: "alice@acme.com" },
                    { type: "text", content: "2023-04-01" },
                ],
                [
                    { type: "text", content: "c2" },
                    { type: "text", content: "Bob Smith" },
                    { type: "text", content: "ct2" },
                    { type: "text", content: "bob@acme.com" },
                    { type: "text", content: "2023-07-10" },
                ],
                [
                    { type: "text", content: "c3" },
                    { type: "text", content: "Carlos Mendez" },
                    { type: "text", content: "ct3" },
                    { type: "text", content: "carlos@omg.co" },
                    { type: "text", content: "2024-01-15" },
                ],
                [
                    { type: "text", content: "c4" },
                    { type: "text", content: "Diana Prince" },
                    { type: "text", content: "ct2" },
                    { type: "text", content: "diana@wonder.com" },
                    { type: "text", content: "2023-11-30" },
                ],
                [
                    { type: "text", content: "c5" },
                    { type: "text", content: "Ethan Hunt" },
                    { type: "text", content: "ct4" },
                    { type: "text", content: "ethan@imf.org" },
                    { type: "text", content: "2022-12-09" },
                ],
            ],
        },
    },
    {
        id: "cities",
        content: {
            type: "table",
            columns: ["id", "name", "state", "population"],
            data: [
                [
                    { type: "text", content: "ct1" },
                    { type: "text", content: "New York" },
                    { type: "text", content: "NY" },
                    { type: "text", content: "8_467_000" },
                ],
                [
                    { type: "text", content: "ct2" },
                    { type: "text", content: "Los Angeles" },
                    { type: "text", content: "CA" },
                    { type: "text", content: "3_979_000" },
                ],
                [
                    { type: "text", content: "ct3" },
                    { type: "text", content: "Chicago" },
                    { type: "text", content: "IL" },
                    { type: "text", content: "2_693_000" },
                ],
                [
                    { type: "text", content: "ct4" },
                    { type: "text", content: "Miami" },
                    { type: "text", content: "FL" },
                    { type: "text", content: "478_251" },
                ],
            ],
        },
    },
    {
        id: "orders",
        content: {
            type: "table",
            columns: ["id", "customer_id", "total", "date", "status"],
            data: [
                [
                    { type: "text", content: "o1" },
                    { type: "text", content: "c1" },
                    { type: "text", content: "120.00" },
                    { type: "text", content: "2024-10-05" },
                    { type: "text", content: "shipped" },
                ],
                [
                    { type: "text", content: "o2" },
                    { type: "text", content: "c2" },
                    { type: "text", content: "45.50" },
                    { type: "text", content: "2024-09-22" },
                    { type: "text", content: "delivered" },
                ],
                [
                    { type: "text", content: "o3" },
                    { type: "text", content: "c3" },
                    { type: "text", content: "250.00" },
                    { type: "text", content: "2024-11-02" },
                    { type: "text", content: "processing" },
                ],
                [
                    { type: "text", content: "o4" },
                    { type: "text", content: "c2" },
                    { type: "text", content: "15.75" },
                    { type: "text", content: "2024-11-12" },
                    { type: "text", content: "returned" },
                ],
                [
                    { type: "text", content: "o5" },
                    { type: "text", content: "c4" },
                    { type: "text", content: "88.30" },
                    { type: "text", content: "2024-11-18" },
                    { type: "text", content: "delivered" },
                ],
            ],
        },
    },
    {
        id: "products",
        content: {
            type: "table",
            columns: ["id", "sku", "name", "price"],
            data: [
                [
                    { type: "text", content: "p1" },
                    { type: "text", content: "SKU-101" },
                    { type: "text", content: "Widget A" },
                    { type: "text", content: "9.99" },
                ],
                [
                    { type: "text", content: "p2" },
                    { type: "text", content: "SKU-102" },
                    { type: "text", content: "Gadget B" },
                    { type: "text", content: "19.99" },
                ],
                [
                    { type: "text", content: "p3" },
                    { type: "text", content: "SKU-103" },
                    { type: "text", content: "Thingamajig C" },
                    { type: "text", content: "24.50" },
                ],
            ],
        },
    },
    {
        id: "order_items",
        content: {
            type: "table",
            columns: ["id", "order_id", "product_id", "qty", "item_total"],
            data: [
                [
                    { type: "text", content: "oi1" },
                    { type: "text", content: "o1" },
                    { type: "text", content: "p1" },
                    { type: "text", content: "2" },
                    { type: "text", content: "19.98" },
                ],
                [
                    { type: "text", content: "oi2" },
                    { type: "text", content: "o1" },
                    { type: "text", content: "p2" },
                    { type: "text", content: "1" },
                    { type: "text", content: "19.99" },
                ],
                [
                    { type: "text", content: "oi3" },
                    { type: "text", content: "o2" },
                    { type: "text", content: "p3" },
                    { type: "text", content: "1" },
                    { type: "text", content: "24.50" },
                ],
                [
                    { type: "text", content: "oi4" },
                    { type: "text", content: "o3" },
                    { type: "text", content: "p2" },
                    { type: "text", content: "2" },
                    { type: "text", content: "39.98" },
                ],
            ],
        },
    },
    {
        id: "company_notes",
        content: {
            type: "text",
            content: dedent(`
                Sample dataset designed for experimenting with joins. 
                'customers' references 'cities' via city_id. 'orders' 
                reference customers via customer_id. There are also products
                & order_items to experiment with many-to-one joins.
            `),
        },
    },
]
