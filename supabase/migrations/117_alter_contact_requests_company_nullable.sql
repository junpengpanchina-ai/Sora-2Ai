-- Allow company to be optional for non-enterprise contact
-- Migration: 117

alter table if exists contact_requests
  alter column company drop not null;

