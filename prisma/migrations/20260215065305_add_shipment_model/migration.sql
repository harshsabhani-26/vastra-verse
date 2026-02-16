-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'READY_TO_SHIP', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED', 'RETURN_INITIATED', 'RETURN_PICKED', 'RETURN_DELIVERED');

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "providerShipmentId" TEXT,
    "awbNumber" TEXT,
    "courierName" TEXT,
    "labelUrl" TEXT,
    "trackingUrl" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "isReturn" BOOLEAN NOT NULL DEFAULT false,
    "pickupScheduledAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "returnInitiatedAt" TIMESTAMP(3),
    "estimatedDeliveryAt" TIMESTAMP(3),
    "weight" DECIMAL(65,30),
    "length" DECIMAL(65,30),
    "breadth" DECIMAL(65,30),
    "height" DECIMAL(65,30),
    "providerResponse" JSONB,
    "trackingData" JSONB,
    "cancellationReason" TEXT,
    "failureReason" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_providerShipmentId_key" ON "Shipment"("providerShipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_awbNumber_key" ON "Shipment"("awbNumber");

-- CreateIndex
CREATE INDEX "Shipment_orderId_idx" ON "Shipment"("orderId");

-- CreateIndex
CREATE INDEX "Shipment_awbNumber_idx" ON "Shipment"("awbNumber");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE INDEX "Shipment_isReturn_idx" ON "Shipment"("isReturn");

-- CreateIndex
CREATE INDEX "Shipment_createdAt_idx" ON "Shipment"("createdAt");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
