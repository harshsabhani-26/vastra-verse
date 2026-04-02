import { config } from "dotenv";
config({ path: ".env" });

async function testShiprocket() {
    const { checkServiceability } = await import("@/lib/shiprocket/serviceability");
    const { createShipment, assignAwb } = await import("@/lib/shiprocket/shipment");
    console.log("🚀 Starting Shiprocket Local Test...");

    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || email === "your-shiprocket-email@example.com" || !password || password === "your-shiprocket-password") {
        console.error("❌ ERROR: Please enter real Shiprocket credentials in your .env file.");
        console.error("Missing/Default values found for config:");
        console.error(`- SHIPROCKET_EMAIL: ${email}`);
        console.error(`- SHIPROCKET_PASSWORD: ${password}`);
        process.exit(1);
    }

    try {
        // 1. Test Auth & Serviceability
        console.log("\n1️⃣ Testing Authentication & Serviceability...");
        console.log("Checking delivery to 110001 from your pickup location (1kg, Prepaid)...");
        const pickupPin = process.env.SHIPROCKET_PICKUP_PINCODE || "395002";
        
        const serviceResult = await checkServiceability(pickupPin, "110001", 1.0, false);
        
        if (serviceResult.serviceable) {
            console.log(`✅ Success! Found ${serviceResult.couriers.length} available couriers.`);
            if (serviceResult.couriers.length > 0) {
                console.log(`First available: ${serviceResult.couriers[0].name} @ ₹${serviceResult.couriers[0].freightCharge}`);
            }
        } else {
            console.log("❌ Failed: Route not serviceable.");
        }

        // 2. Mock Order Creation
        console.log("\n2️⃣ Testing Order Creation (This will appear in your Shiprocket dashboard!)...");
        
        // Creating a dummy order ID
        const dummyOrderId = `LOCAL_TEST_${Math.floor(Math.random() * 10000)}`;

        const payload = {
            order_id: dummyOrderId,
            order_date: new Date().toISOString().split("T")[0],
            pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Vastra-Verse",
            billing_customer_name: "Local Test User",
            billing_last_name: "",
            billing_address: "123 Test Street",
            billing_city: "Surat",
            billing_pincode: pickupPin,
            billing_state: "Gujarat",
            billing_country: "India",
            billing_phone: "9876543210",
            billing_email: "test@example.com",
            shipping_is_billing: true,
            order_items: [
                {
                    name: "Test Local Item",
                    sku: "TEST-SKU-01",
                    units: 1,
                    selling_price: 150,
                }
            ],
            payment_method: "Prepaid",
            sub_total: 150,
            length: 10,
            breadth: 10,
            height: 10,
            weight: 0.5,
        };

        const orderResponse = await createShipment(payload as any);
        console.log(`✅ Order Created Successfully!`);
        console.log(`- Shiprocket Order ID: ${orderResponse.order_id}`);
        console.log(`- Shiprocket Shipment ID: ${orderResponse.shipment_id}`);

        // 3. AWB Assignment
        console.log("\n3️⃣ Testing AWB Assignment...");
        const awbReq = await assignAwb({ shipment_id: orderResponse.shipment_id });
        console.log("✅ AWB Assigned Successfully!");
        console.log(`- AWB Number: ${awbReq.response?.data?.awb_code}`);
        console.log(`- Courier Name: ${awbReq.response?.data?.courier_name}`);

        console.log("\n🎉 ALL TESTS PASSED! Shiprocket Integration is fully working locally.");
        console.log("👉 Go to your Shiprocket Dashboard -> Orders -> Processing to see this test order.");
        console.log("⚠️ WE ARE NOT SCHEDULING PICKUP - so you can simply cancel this test order from your Shiprocket dashboard.");

    } catch (error: any) {
        console.error("\n❌ TEST FAILED:", error.message || error);
        if (error.response?.data) {
            console.error("API Response:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

testShiprocket();
