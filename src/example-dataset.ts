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
                [
                    { type: "text", content: "c6" },
                    { type: "text", content: "Farah Malik" },
                    { type: "text", content: "ct5" },
                    { type: "text", content: "farah@starlight.io" },
                    { type: "text", content: "2023-06-21" },
                ],
                [
                    { type: "text", content: "c7" },
                    { type: "text", content: "Gus Rivera" },
                    { type: "text", content: "ct6" },
                    { type: "text", content: "gus@lumen.tech" },
                    { type: "text", content: "2024-03-08" },
                ],
                [
                    { type: "text", content: "c8" },
                    { type: "text", content: "Harper Lee" },
                    { type: "text", content: "ct2" },
                    { type: "text", content: "harper@orca.studio" },
                    { type: "text", content: "2024-05-17" },
                ],
                [
                    { type: "text", content: "c9" },
                    { type: "text", content: "Ian Kim" },
                    { type: "text", content: "ct7" },
                    { type: "text", content: "ian@echopark.com" },
                    { type: "text", content: "2023-12-12" },
                ],
                [
                    { type: "text", content: "c10" },
                    { type: "text", content: "Jasmine Patel" },
                    { type: "text", content: "ct3" },
                    { type: "text", content: "jasmine@aurora.co" },
                    { type: "text", content: "2024-01-27" },
                ],
                [
                    { type: "text", content: "c11" },
                    { type: "text", content: "Leo Chapman" },
                    { type: "text", content: "ct1" },
                    { type: "text", content: "leo@peakcloud.com" },
                    { type: "text", content: "2024-04-09" },
                ],
                [
                    { type: "text", content: "c12" },
                    { type: "text", content: "Maya Flores" },
                    { type: "text", content: "ct5" },
                    { type: "text", content: "maya@vista.space" },
                    { type: "text", content: "2024-09-02" },
                ],
                [
                    { type: "text", content: "c13" },
                    { type: "text", content: "Nate Lewis" },
                    { type: "text", content: "ct8" },
                    { type: "text", content: "nate@cortex.ai" },
                    { type: "text", content: "2023-10-30" },
                ],
                [
                    { type: "text", content: "c14" },
                    { type: "text", content: "Omar Wang" },
                    { type: "text", content: "ct4" },
                    { type: "text", content: "omar@wavefront.io" },
                    { type: "text", content: "2022-11-18" },
                ],
                [
                    { type: "text", content: "c15" },
                    { type: "text", content: "Priya Narang" },
                    { type: "text", content: "ct6" },
                    { type: "text", content: "priya@lensdata.org" },
                    { type: "text", content: "2024-08-05" },
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
                    { type: "text", content: "8467000" },
                ],
                [
                    { type: "text", content: "ct2" },
                    { type: "text", content: "Los Angeles" },
                    { type: "text", content: "CA" },
                    { type: "text", content: "3979000" },
                ],
                [
                    { type: "text", content: "ct3" },
                    { type: "text", content: "Chicago" },
                    { type: "text", content: "IL" },
                    { type: "text", content: "2693000" },
                ],
                [
                    { type: "text", content: "ct4" },
                    { type: "text", content: "Miami" },
                    { type: "text", content: "FL" },
                    { type: "text", content: "478251" },
                ],
                [
                    { type: "text", content: "ct5" },
                    { type: "text", content: "Denver" },
                    { type: "text", content: "CO" },
                    { type: "text", content: "715000" },
                ],
                [
                    { type: "text", content: "ct6" },
                    { type: "text", content: "Austin" },
                    { type: "text", content: "TX" },
                    { type: "text", content: "1010000" },
                ],
                [
                    { type: "text", content: "ct7" },
                    { type: "text", content: "Seattle" },
                    { type: "text", content: "WA" },
                    { type: "text", content: "789000" },
                ],
                [
                    { type: "text", content: "ct8" },
                    { type: "text", content: "Boston" },
                    { type: "text", content: "MA" },
                    { type: "text", content: "692000" },
                ],
                [
                    { type: "text", content: "ct9" },
                    { type: "text", content: "Portland" },
                    { type: "text", content: "OR" },
                    { type: "text", content: "659000" },
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
                [
                    { type: "text", content: "o6" },
                    { type: "text", content: "c7" },
                    { type: "text", content: "142.00" },
                    { type: "text", content: "2024-11-22" },
                    { type: "text", content: "processing" },
                ],
                [
                    { type: "text", content: "o7" },
                    { type: "text", content: "c11" },
                    { type: "text", content: "205.60" },
                    { type: "text", content: "2024-11-24" },
                    { type: "text", content: "shipped" },
                ],
                [
                    { type: "text", content: "o8" },
                    { type: "text", content: "c14" },
                    { type: "text", content: "54.75" },
                    { type: "text", content: "2024-10-29" },
                    { type: "text", content: "returned" },
                ],
                [
                    { type: "text", content: "o9" },
                    { type: "text", content: "c8" },
                    { type: "text", content: "311.90" },
                    { type: "text", content: "2024-11-30" },
                    { type: "text", content: "delivered" },
                ],
                [
                    { type: "text", content: "o10" },
                    { type: "text", content: "c15" },
                    { type: "text", content: "19.99" },
                    { type: "text", content: "2024-12-01" },
                    { type: "text", content: "processing" },
                ],
                [
                    { type: "text", content: "o11" },
                    { type: "text", content: "c2" },
                    { type: "text", content: "62.30" },
                    { type: "text", content: "2024-11-27" },
                    { type: "text", content: "shipped" },
                ],
                [
                    { type: "text", content: "o12" },
                    { type: "text", content: "c5" },
                    { type: "text", content: "92.40" },
                    { type: "text", content: "2024-11-17" },
                    { type: "text", content: "delivered" },
                ],
                [
                    { type: "text", content: "o13" },
                    { type: "text", content: "c12" },
                    { type: "text", content: "134.20" },
                    { type: "text", content: "2024-11-20" },
                    { type: "text", content: "processing" },
                ],
                [
                    { type: "text", content: "o14" },
                    { type: "text", content: "c1" },
                    { type: "text", content: "48.65" },
                    { type: "text", content: "2024-11-23" },
                    { type: "text", content: "delivered" },
                ],
                [
                    { type: "text", content: "o15" },
                    { type: "text", content: "c9" },
                    { type: "text", content: "210.55" },
                    { type: "text", content: "2024-11-25" },
                    { type: "text", content: "shipped" },
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
                [
                    { type: "text", content: "p4" },
                    { type: "text", content: "SKU-104" },
                    { type: "text", content: "Doohickey D" },
                    { type: "text", content: "34.00" },
                ],
                [
                    { type: "text", content: "p5" },
                    { type: "text", content: "SKU-105" },
                    { type: "text", content: "Gizmo E" },
                    { type: "text", content: "42.75" },
                ],
                [
                    { type: "text", content: "p6" },
                    { type: "text", content: "SKU-106" },
                    { type: "text", content: "Contraption F" },
                    { type: "text", content: "58.20" },
                ],
                [
                    { type: "text", content: "p7" },
                    { type: "text", content: "SKU-107" },
                    { type: "text", content: "Bundle G" },
                    { type: "text", content: "99.00" },
                ],
                [
                    { type: "text", content: "p8" },
                    { type: "text", content: "SKU-108" },
                    { type: "text", content: "Widget H" },
                    { type: "text", content: "11.25" },
                ],
                [
                    { type: "text", content: "p9" },
                    { type: "text", content: "SKU-109" },
                    { type: "text", content: "Gadget I" },
                    { type: "text", content: "64.40" },
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
                [
                    { type: "text", content: "oi5" },
                    { type: "text", content: "o6" },
                    { type: "text", content: "p4" },
                    { type: "text", content: "3" },
                    { type: "text", content: "102.00" },
                ],
                [
                    { type: "text", content: "oi6" },
                    { type: "text", content: "o6" },
                    { type: "text", content: "p1" },
                    { type: "text", content: "1" },
                    { type: "text", content: "9.99" },
                ],
                [
                    { type: "text", content: "oi7" },
                    { type: "text", content: "o7" },
                    { type: "text", content: "p7" },
                    { type: "text", content: "2" },
                    { type: "text", content: "198.00" },
                ],
                [
                    { type: "text", content: "oi8" },
                    { type: "text", content: "o8" },
                    { type: "text", content: "p5" },
                    { type: "text", content: "1" },
                    { type: "text", content: "42.75" },
                ],
                [
                    { type: "text", content: "oi9" },
                    { type: "text", content: "o9" },
                    { type: "text", content: "p2" },
                    { type: "text", content: "1" },
                    { type: "text", content: "19.99" },
                ],
                [
                    { type: "text", content: "oi10" },
                    { type: "text", content: "o9" },
                    { type: "text", content: "p6" },
                    { type: "text", content: "2" },
                    { type: "text", content: "116.40" },
                ],
                [
                    { type: "text", content: "oi11" },
                    { type: "text", content: "o10" },
                    { type: "text", content: "p8" },
                    { type: "text", content: "1" },
                    { type: "text", content: "11.25" },
                ],
                [
                    { type: "text", content: "oi12" },
                    { type: "text", content: "o11" },
                    { type: "text", content: "p3" },
                    { type: "text", content: "2" },
                    { type: "text", content: "49.00" },
                ],
                [
                    { type: "text", content: "oi13" },
                    { type: "text", content: "o12" },
                    { type: "text", content: "p9" },
                    { type: "text", content: "1" },
                    { type: "text", content: "64.40" },
                ],
                [
                    { type: "text", content: "oi14" },
                    { type: "text", content: "o13" },
                    { type: "text", content: "p5" },
                    { type: "text", content: "3" },
                    { type: "text", content: "128.25" },
                ],
                [
                    { type: "text", content: "oi15" },
                    { type: "text", content: "o14" },
                    { type: "text", content: "p1" },
                    { type: "text", content: "2" },
                    { type: "text", content: "19.98" },
                ],
                [
                    { type: "text", content: "oi16" },
                    { type: "text", content: "o15" },
                    { type: "text", content: "p6" },
                    { type: "text", content: "1" },
                    { type: "text", content: "58.20" },
                ],
            ],
        },
    },
    {
        id: "support_tickets",
        content: {
            type: "table",
            columns: ["id", "customer_id", "priority", "opened_at", "status"],
            data: [
                [
                    { type: "text", content: "t1" },
                    { type: "text", content: "c1" },
                    { type: "text", content: "high" },
                    { type: "text", content: "2024-11-12" },
                    { type: "text", content: "open" },
                ],
                [
                    { type: "text", content: "t2" },
                    { type: "text", content: "c3" },
                    { type: "text", content: "medium" },
                    { type: "text", content: "2024-11-20" },
                    { type: "text", content: "waiting" },
                ],
                [
                    { type: "text", content: "t3" },
                    { type: "text", content: "c9" },
                    { type: "text", content: "low" },
                    { type: "text", content: "2024-11-02" },
                    { type: "text", content: "closed" },
                ],
                [
                    { type: "text", content: "t4" },
                    { type: "text", content: "c15" },
                    { type: "text", content: "high" },
                    { type: "text", content: "2024-11-24" },
                    { type: "text", content: "open" },
                ],
                [
                    { type: "text", content: "t5" },
                    { type: "text", content: "c6" },
                    { type: "text", content: "medium" },
                    { type: "text", content: "2024-10-30" },
                    { type: "text", content: "resolved" },
                ],
            ],
        },
    },
    {
        id: "product_reviews",
        content: {
            type: "table",
            columns: ["id", "product_id", "customer_id", "rating", "comment"],
            data: [
                [
                    { type: "text", content: "r1" },
                    { type: "text", content: "p1" },
                    { type: "text", content: "c1" },
                    { type: "text", content: "4" },
                    { type: "text", content: "Good balance of price and quality." },
                ],
                [
                    { type: "text", content: "r2" },
                    { type: "text", content: "p7" },
                    { type: "text", content: "c11" },
                    { type: "text", content: "5" },
                    { type: "text", content: "Exceeded expectations for reliability." },
                ],
                [
                    { type: "text", content: "r3" },
                    { type: "text", content: "p3" },
                    { type: "text", content: "c2" },
                    { type: "text", content: "3" },
                    { type: "text", content: "Works well but shipping was slow." },
                ],
            ],
        },
    },
    {
        id: "shipping_updates",
        content: {
            type: "text",
            content: dedent(`
                Recent shipping notes include faster transit to the West Coast hubs and
                a spike in returned orders originating from Chicago. Use the new dataset
                records to experiment with joining to "orders" and "cities" to surface
                regional patterns.
            `),
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
    {
        id: "example_object",
        content: {
            type: "object",
            data: {
                name: "Example Object",
                description: "This is a sample object value for testing.",
                attributes: {
                    color: "blue",
                    size: "medium",
                    inStock: true,
                },
                tags: ["sample", "test", "object"],
            },
        },
    },
]
