import mongoose from "mongoose";
import app from "./app";
import http from "http";

import { OrderDocument, OrderSchema } from "./models/Order";
import { GenreDocument, GenreSchema } from "./models/Genre";
import { ConditionDocument, ConditionSchema } from "./models/Condition";
import { StockDocument, StockSchema } from "./models/Stock";
import { StockItemDocument, StockItemSchema } from "./models/StockItem";

const mongodbUrl = process.env.MONGODB_URL as string;
const port = process.env.PORT as string;

mongoose
  .connect(mongodbUrl, {
    dbName: "goldenrack",
  })
  .then(() => {
    const httpServer = http.createServer(app);

    httpServer.listen(port, () => {
      console.log("Database goldenrack is connected");
      console.log(`HTTP Server is running on http://localhost:${port}`);
    });
  })
  .catch((error: Error) => {
    console.log("MongDB connection error" + error);
    process.exit(1);
  });

mongoose.model<OrderDocument>("Order", OrderSchema);
mongoose.model<GenreDocument>("Genre", GenreSchema);
mongoose.model<ConditionDocument>("Condition", ConditionSchema);
mongoose.model<StockDocument>("Stock", StockSchema);
mongoose.model<StockItemDocument>("StockItem", StockItemSchema);
