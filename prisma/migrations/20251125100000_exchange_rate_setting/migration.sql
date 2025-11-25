CREATE TABLE "ExchangeRateSetting" (
    "id" TEXT NOT NULL,
    "usdToCdf" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    CONSTRAINT "ExchangeRateSetting_pkey" PRIMARY KEY ("id")
);

-- Trigger to update updatedAt
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_exchange_rate_updated_at
BEFORE UPDATE ON "ExchangeRateSetting"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
