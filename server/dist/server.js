import "dotenv/config";
import cors from "cors";
import express from "express";
const app = express();
const port = 3000;
app.use(cors({
    origin: "http://localhost:5173",
}));
app.use(express.json());
app.get("/api/health", (_request, response) => {
    response.json({
        status: "ok",
        message: "Internal Helpdesk API is running",
    });
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
