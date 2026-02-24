-- Fix: flatrate_providers default must be NULL so tracking hook can distinguish
-- "not yet processed" (NULL) from "processed, no providers" ([])
ALTER TABLE public.user_title_history ALTER COLUMN flatrate_providers SET DEFAULT NULL;