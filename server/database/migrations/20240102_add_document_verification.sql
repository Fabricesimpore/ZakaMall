-- Add document verification status enum
CREATE TYPE document_status AS ENUM ('pending', 'verified', 'rejected');

-- Add document verification fields to vendors table
ALTER TABLE vendors 
ADD COLUMN identity_document_status document_status DEFAULT 'pending',
ADD COLUMN business_license_status document_status DEFAULT 'pending',
ADD COLUMN identity_document_notes text,
ADD COLUMN business_license_notes text,
ADD COLUMN document_reviewed_at timestamp,
ADD COLUMN document_reviewer_id varchar REFERENCES users(id);

-- Create document audit log table for tracking verification history
CREATE TABLE document_audit_log (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id varchar NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  document_type varchar(50) NOT NULL, -- 'identity' or 'business_license'
  old_status document_status,
  new_status document_status NOT NULL,
  reviewer_id varchar REFERENCES users(id),
  notes text,
  created_at timestamp DEFAULT now()
);

-- Index for better query performance
CREATE INDEX idx_document_audit_log_vendor_id ON document_audit_log(vendor_id);
CREATE INDEX idx_document_audit_log_document_type ON document_audit_log(document_type);
CREATE INDEX idx_vendors_document_status ON vendors(identity_document_status, business_license_status);