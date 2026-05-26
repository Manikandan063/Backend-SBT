- [ ] Inspect current code for server/app/db correctness and env loading
- [ ] Patch src/app.js to ensure proper Express app export
- [ ] Patch src/config/db.js to ensure single Sequelize instance, correct dotenv loading, robust connectDB with try/catch
- [ ] Patch src/server.js to await connectDB before listen and print required success messages
- [ ] Patch package.json scripts (if needed) to support ESM + nodemon correctly
- [ ] Run `npm run dev` to verify server starts without crashing and DB authentication success message prints

