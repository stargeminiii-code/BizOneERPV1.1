# FAD → BizOne ERP: Data Dictionary & Migration Baseline

## Purpose

This document establishes the first independent migration/reference layer for the `.hive` artifacts in the FAD repository. The FAD artifacts are treated as exported/local application data and business-structure evidence, not as a source-code dependency of BizOne ERP.

BizOne must implement its own data model and business logic. No proprietary executable/source implementation is copied into BizOne.

## Observed FAD artifacts

The current FAD repository exposes these `.hive` datasets:

- `account_object.hive` — account / user / channel objects. Observed records include Shopee, TikTok Shop, Lazada and business-account metadata.
- `box_user_role.hive` — user-role relationships.
- `box_table_config.hive` — table/configuration metadata.
- `inventory_item.hive` — inventory/product master records.
- `inventory_item_detail.hive` — inventory detail / unit / item-level records.
- `promotion.hive` — promotion master.
- `promotion_detail.hive` — promotion rules/details.
- `price_policy.hive` — pricing policy.
- `customer_category.hive` — customer segmentation/category.
- `seller_other.hive` — seller/other-party records.

The binary `.hive` format is not assumed to be a portable database format. The migration engine therefore uses an analysis stage before any write into BizOne.

## Initial business-domain mapping

| FAD artifact | BizOne domain | Initial target |
|---|---|---|
| account_object | Omnichannel / accounts | `sales_channels`, `channel_accounts`, `external_accounts` |
| box_user_role | IAM | `roles`, `permissions`, `user_roles` |
| box_table_config | Configuration | `tenant_settings`, `module_settings`, `table_preferences` |
| inventory_item | Product & Inventory | `products`, `product_variants`, `inventory_balances` |
| inventory_item_detail | Product/Inventory detail | `product_units`, `inventory_lots`, `inventory_transactions` |
| promotion | Marketing / Sales | `promotions` |
| promotion_detail | Marketing / Sales | `promotion_rules`, `promotion_items` |
| price_policy | Pricing | `price_lists`, `price_rules`, `customer_price_rules` |
| customer_category | CRM | `customer_segments`, `customer_segment_memberships` |
| seller_other | Suppliers / partners | `suppliers`, `business_partners` |

## Business areas to cover

The migration/reference model is intended to cover all ERP domains:

1. Organization and multi-tenant setup
2. Users, roles, permissions and data scope
3. Products, variants, SKU, units and pack sizes
4. Warehouses, locations and stock
5. FIFO lots and stock aging
6. Purchasing and supplier debt
7. Sales, orders and order lines
8. Omnichannel marketplace accounts
9. Customers and CRM
10. Promotions, vouchers and price policies
11. Payments, cash/bank and QR payments
12. F&B recipes/BOM and ingredient deduction
13. Marketing, attribution, ROAS and CPA
14. Tasks, KPI and management hierarchy
15. Reports and executive dashboard
16. Audit trail and migration history

## Migration rules

### Identity

- Preserve original FAD IDs in `source_id` fields.
- Store the originating dataset in `source_system` and `source_table`.
- Never overwrite a BizOne primary key with an external/local FAD ID.
- Use deterministic fingerprints to prevent duplicate imports.

### Products and SKU

- Product and variant are separate entities.
- Variants share the same product master where the source indicates the same product.
- BizOne SKU generation follows the existing BizOne SKU convention rather than reproducing an external application's internal code scheme.

### Inventory

- Preserve quantity, unit and timestamps when available.
- Map stock movements into immutable inventory transactions.
- Rebuild current balances from transactions where sufficient movement data exists.
- FIFO is implemented by BizOne, independently of the source application's internal implementation.

### Customers and suppliers

- Normalize phone/email before matching.
- Prefer source ID as the first identity key.
- Use deterministic matching only when source ID is absent.
- Never silently merge two records when identity confidence is ambiguous.

### Promotions and pricing

- Import master/detail records separately.
- Preserve source validity periods and conditions.
- Convert them into BizOne rules after validation.

## Import pipeline

```text
FAD .hive files
      ↓
Binary inspection / record discovery
      ↓
Source-field extraction
      ↓
Normalization
      ↓
Mapping to BizOne domains
      ↓
Validation + conflict report
      ↓
Dry-run preview
      ↓
Tenant-scoped import
      ↓
Migration audit log
```

## Safety requirements

- Never import directly into production without a dry-run.
- Every imported record must retain source provenance.
- Failed records are isolated in an error report; successful records are not rolled back silently.
- Migration must be idempotent: re-running the same source dataset must not create duplicates.
- The importer must not require or expose application secrets.

## Current limitation

The `.hive` files are binary and are not a documented public interchange format. The first implementation therefore provides binary inspection, string/JSON discovery, provenance and mapping infrastructure. Full field-level decoding should be added only after the actual binary structure is validated against the supplied FAD data.
