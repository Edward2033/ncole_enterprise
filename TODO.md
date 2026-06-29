- [ ] Gather repo context (users + vendors services/controllers) 
- [ ] Draft edit plan (transactional vendor provisioning on role change + idempotency)
- [ ] Update `adminUpdateUser()` to provision vendor via Prisma upsert inside a DB transaction; add error logging
- [ ] Fix vendor retrieval to return correct vendor list incl. joined user data and a `status` field aligned to frontend expectations
- [ ] Update vendor service/controller code accordingly
- [ ] Run backend tests / TypeScript build to ensure no compilation errors
- [ ] (Optional) Provide SQL/Prisma validation notes if schema mismatch occurs

