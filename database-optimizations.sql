-- Optimisations de la base de données SQLite pour PajoPharma
-- Ajout d'index pour améliorer les performances des requêtes

-- Index pour les recherches de médicaments (très fréquentes)
CREATE INDEX IF NOT EXISTS idx_medications_name ON Medication(name);
CREATE INDEX IF NOT EXISTS idx_medications_barcode ON Medication(barcode);
CREATE INDEX IF NOT EXISTS idx_medications_available_stock ON Medication(isAvailableForSale, quantity);
CREATE INDEX IF NOT EXISTS idx_medications_expiration ON Medication(expirationDate);

-- Index pour les ventes (requêtes avec relations)
CREATE INDEX IF NOT EXISTS idx_sales_date ON Sale(date);
CREATE INDEX IF NOT EXISTS idx_sales_seller ON Sale(sellerId);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON SaleItem(saleId);
CREATE INDEX IF NOT EXISTS idx_sale_items_medication ON SaleItem(medicationId);

-- Index pour les logs d'audit
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON AuditLog(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON AuditLog(userId);

-- Index composite pour les recherches complexes
CREATE INDEX IF NOT EXISTS idx_medications_search ON Medication(isAvailableForSale, quantity, name);
CREATE INDEX IF NOT EXISTS idx_sales_complex ON Sale(date DESC, sellerId);