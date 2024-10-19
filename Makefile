SHELL = bash
.SILENT:
.PHONY:
.DEFAULT_GOAL := list

list:
	@grep '^[^#[:space:]].*:' Makefile

fe-serve:
	cd frontend/;
	hugo serve

be-upload-products:
	npx wrangler kv key put --binding PRODUCTS product-list "$(cat products.json)" --config "backend/wrangler.toml"