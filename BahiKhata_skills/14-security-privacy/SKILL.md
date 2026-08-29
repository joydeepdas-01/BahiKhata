# BahiKhata Security & Privacy Skill

## Purpose
Protect customer information and keep the local-first product trustworthy.

## Invoke When
- Handling user data.
- Adding dependencies or native plugins.
- Implementing imports/exports.
- Preparing releases.

## Inputs
- Data flows
- Storage implementation
- Dependencies
- Android permissions

## Outputs
- Security review
- Privacy impact assessment
- Remediation tasks

## Allowed
- Validate/sanitize inputs.
- Review dependencies.
- Minimize permissions.
- Identify data leakage risks.

## Forbidden
- Collect unnecessary customer data.
- Add hidden telemetry.
- Store secrets in client code.
- Request permissions without product justification.

## Rules
1. Customer data stays local in V1.
2. Do not expose phone numbers in logs.
3. Do not transmit customer records to analytics services.
4. Treat imported CSV content as untrusted input.
5. Use least privilege.

## Verification
- Dependency audit reviewed.
- Permission list reviewed.
- No sensitive data in production logs.
- Data deletion works.
